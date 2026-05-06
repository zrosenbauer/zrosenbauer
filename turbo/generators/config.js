const fs = require("node:fs");
const path = require("node:path");

/**
 * Turbo generator: clone a committed resume template into a new gitignored
 * tailored copy under `.tailored/<name>/`.
 *
 * Run via: `pnpm resume:new`.
 *
 * Flow:
 *   1. Pick a source template — any dir under `resumes/` (e.g. `primary`).
 *   2. Pick a name for the tailored copy (e.g. `acme`, `recruiter-foo`).
 *   3. The generator copies the four YAML files verbatim into
 *      `.tailored/<name>/` and writes a templated `package.json` set up to
 *      render into `.tailored/<name>/output/` (each workspace owns its own
 *      output dir; turbo.json at the repo root handles caching).
 *
 * Edit `.tailored/<name>/cv.yaml` to tailor for the role, then
 * `pnpm --filter @resume/<name> render` (or `pnpm resume:render`).
 */
module.exports = function generator(plop) {
  plop.setGenerator("resume", {
    description: "Clone a resume template into .tailored/<name>/",
    prompts: [
      {
        type: "list",
        name: "template",
        message: "Which template to clone from?",
        choices: listTemplates(),
      },
      {
        type: "input",
        name: "name",
        message: "Tailored resume name (kebab-case, e.g. 'acme', 'recruiter-foo'):",
        validate: (input) => {
          if (!/^[a-z0-9][a-z0-9-]*$/.test(input)) {
            return "Use kebab-case: lowercase letters, digits, and dashes only.";
          }
          if (input === "_template" || input === "output") {
            return `'${input}' is reserved.`;
          }
          if (fs.existsSync(path.join(repoRoot(), ".tailored", input))) {
            return `.tailored/${input} already exists.`;
          }
          return true;
        },
      },
    ],
    actions: function actions(answers) {
      const yamlFiles = ["cv.yaml", "design.yaml", "locale.yaml", "settings.yaml"];

      return [
        // Copy YAML files verbatim from the chosen template.
        ...yamlFiles.map((file) => ({
          type: "add",
          path: `{{turbo.paths.root}}/.tailored/{{name}}/${file}`,
          templateFile: path.join(repoRoot(), "resumes", answers.template, file),
          // The yaml files have no `{{}}` patterns so handlebars passes them
          // through unchanged. If a future template adds literal `{{` it will
          // need escaping (use `\{{` to opt out).
        })),
        // Write the templated package.json (sets workspace name + scripts).
        {
          type: "add",
          path: "{{turbo.paths.root}}/.tailored/{{name}}/package.json",
          templateFile: "templates/_meta/package.json.hbs",
        },
        // Copy the source template's `fonts/` directory into the new
        // workspace as real files. RenderCV needs `fonts/` adjacent to the
        // cv.yaml; each workspace owns its own copy (~1.2 MB) so it's
        // self-contained and never depends on a sibling.
        function copyFonts(_answers) {
          const src = path.join(repoRoot(), "resumes", _answers.template, "fonts");
          const dest = path.join(repoRoot(), ".tailored", _answers.name, "fonts");
          if (!fs.existsSync(src)) return `No fonts/ in resumes/${_answers.template}; skipped.`;
          fs.cpSync(src, dest, { recursive: true });
          return `Copied resumes/${_answers.template}/fonts → .tailored/${_answers.name}/fonts`;
        },
        function summary(_answers) {
          return [
            `Cloned resumes/${_answers.template} → .tailored/${_answers.name}/ (gitignored).`,
            `Edit .tailored/${_answers.name}/cv.yaml to tailor for the role.`,
            `Render with: pnpm --filter @resume/${_answers.name} render`,
            `Output lands at: .tailored/${_answers.name}/output/`,
          ].join("\n");
        },
      ];
    },
  });
};

function repoRoot() {
  // turbo gen runs with cwd = repo root.
  return process.cwd();
}

function listTemplates() {
  const dir = path.join(repoRoot(), "resumes");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
}
