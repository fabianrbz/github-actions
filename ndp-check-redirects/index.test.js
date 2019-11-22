const { Toolkit } = require("actions-toolkit");
const nock = require("nock");
const fs = require('fs');

process.env.GITHUB_WORKFLOW = "test";
process.env.GITHUB_ACTION = "ndp-check-redirects";
process.env.GITHUB_ACTOR = "nexmodev";
process.env.GITHUB_REPOSITORY = "nexmo/nexmo-developer";
process.env.GITHUB_EVENT_NAME = "push";
process.env.GITHUB_WORKSPACE = "/tmp";
process.env.GITHUB_EVENT_PATH = __dirname + "/fixtures/pull-request-opened.json";
process.env.GITHUB_SHA = "abc123";

describe("Check Redirects Action", () => {
  let action, tools, owner, repo, base, head;

  // Mock Toolkit.run to define `action` so we can call it
  Toolkit.run = jest.fn(actionFn => {
    action = actionFn;
  });

  // Load up our entrypoint file
  require(".");

  beforeEach(() => {
    tools = new Toolkit();
    tools.log.debug = jest.fn();
    tools.log.pending = jest.fn();
    tools.log.complete = jest.fn();
    tools.log.warn = jest.fn();
    tools.log.info = jest.fn();

    tools.getFile = jest.fn();
    tools.exit.failure = jest.fn();
    tools.exit.success = jest.fn();

    owner = tools.context.payload.repository.owner.name;
    repo = tools.context.payload.repository.name;
    base = tools.context.payload.pull_request.base.sha;
    head = tools.context.payload.pull_request.head.sha;
  });

  describe("When files are renamed or removed", () => {
    let changes = {
      "files": [
        {
          "filename": "_documentation/file1.md",
          "previous_filename": "_documentation/file1_old.md",
          "status": "renamed",
        },
        {
          "filename": "ignored.md",
          "previous_filename": "ignored_old.md",
          "status": "renamed",
        },
        {
          "filename": "_documentation/file2.md",
          "status": "removed",
        },
        {
          "filename": "removed.md",
          "status": "removed",
        }
      ]
    };

    beforeEach(() => {
      mockCommitDiff(
        repo,
        owner,
        base,
        head,
        changes
      );
    });

    describe("With a corresponding redirect", () => {
      it("exits with a success status code if there's a corresponding file that matches the redirect", async () => {
        tools.getFile.mockReturnValueOnce(
          `---
          /file1_old: /file1
          /file2: /file1
          `
        );
        fs.existsSync = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(true);

        await action(tools);

        expect(tools.log.warn).toHaveBeenCalledWith("Ignorning renamed file not in _documentation folder: ignored_old.md");
        expect(tools.log.warn).toHaveBeenCalledWith("Ignorning deleted file not in _documentation folder: removed.md");
        expect(tools.getFile).toHaveBeenCalledWith("config/redirects.yml");
        expect(tools.exit.success).toHaveBeenCalledWith("No missing redirects");
      });

      it("exits with a success status code if it redirects to a tutorial", async () => {
        tools.getFile.mockReturnValueOnce(
          `---
          /file1_old: /tutorials/file1
          /file2: /tutorials/file2
          `
        );

        await action(tools);

        expect(tools.getFile).toHaveBeenCalledWith("config/redirects.yml");
        expect(tools.exit.success).toHaveBeenCalledWith("No missing redirects");
      });

      it("exits with a success status code if it redirects to a use-case", async () => {
        tools.getFile.mockReturnValueOnce(
          `---
          /file1_old: /use-cases/file1
          /file2: /use-cases/file2
          `
        );

        await action(tools);

        expect(tools.getFile).toHaveBeenCalledWith("config/redirects.yml");
        expect(tools.exit.success).toHaveBeenCalledWith("No missing redirects");
      });

      it("exits with a failure status code if the redirect is not valid", async () => {
        tools.getFile.mockReturnValueOnce(
          `---
          /file1_old: /file1-invalid
          /file2: /file2-invalid
          `
        );

        await action(tools);

        expect(tools.getFile).toHaveBeenCalledWith("config/redirects.yml");
        expect(tools.exit.failure).toHaveBeenCalledWith(
          `Missing redirects: 

Specified redirect could not be found: /tmp/_documentation/file1-invalid.md
Specified redirect could not be found: /tmp/_documentation/file2-invalid.md`
      );
      });
    });

    describe("With missing redirects", () => {
      it("exits with a failure code", async () => {
        tools.getFile.mockReturnValueOnce("---{}");

        await action(tools);

        expect(tools.getFile).toHaveBeenCalledWith("config/redirects.yml");
        expect(tools.exit.failure).toHaveBeenCalledWith(
          `Missing redirects: 

"/file1_old": "/file1"
"/file2": "MISSING"`
        );
      });
    });
  });

  describe("Without renamed or removed files", () => {
    let changes = {
      "files": [
        {
          "status": "modified",
        }
      ]
    };

    it("exits with a success code", async () => {
      mockCommitDiff(
        repo,
        owner,
        base,
        head,
        changes
      );
      await action(tools);
      expect(tools.exit.success).toHaveBeenCalledWith("No missing redirects");
    });
  });
});


function mockCommitDiff(repo, owner, base, head, body) {
  nock("https://api.github.com")
    .get(
      `/repos/${owner}/${repo}/compare/${base}...${head}`
    )
    .reply(200, body);
}
