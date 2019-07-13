const { Toolkit } = require("actions-toolkit");
const puppeteer = require("puppeteer");

const tools = new Toolkit();

const categories = {
    "general": 1,
    "client sdk": 2,
    "server sdk - beta": 3,
    "api": 4,
    "server sdk": 5,
    "client sdk - beta": 6
};

(async () => {

  if (tools.context.event !== "release") {
    console.log("Not a release. Skipping");
    process.exit(0);
  }

  if (tools.context.payload.action !== "created") {
    console.log("Release status is not 'created'");
    process.exit(0);
  }

  const release = tools.context.payload.release;
  const repoName = tools.context.payload.repository.name;

  // Use the title from the release, plus anything set in the environment
  let title = release.name;
  if (process.env.HEADWAY_RELEASE_TITLE) {
    title = process.env.HEADWAY_RELEASE_TITLE + ' ' + title;
  }

  // Then the content
  let content = release.body;

  // Sometimes we don't want to link to the release (e.g. if it's a private repo)
  if (!process.env.HEADWAY_DISABLE_REPO_LINK) {
    content += "\n\n" + release.html_url;
  }

  // You can specify a category for the entry to be placed in (see `categories`
  // at the top of this file)
  let category = (process.env.HEADWAY_CATEGORY || '').toLowerCase()

  // We have corresponding `Server SDK - beta` and `Client SDK - beta` categories
  // If you use a prerelease on any other type it'll default to `general` and 
  // need fixing manually
  if (release.prerelease) {
    category += ' - beta';
  }

  let categoryId = categories[category] || categories['general'];
  await addChangelogEntry(categoryId, title, content);
})();

function addChangelogEntry(category, title, content) {
    console.log("Adding changelog");
    return new Promise(async function (resolve, reject) {
    console.log("Launching Browser");
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: 'google-chrome-unstable',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log("Creating page");
        const page = await browser.newPage();

        // Login
        console.log("Logging In");
        await page.goto('https://headwayapp.co/login');
        await page.type('#user_email', process.env.HEADWAY_USERNAME);
        await page.type('#user_password', process.env.HEADWAY_PASSWORD);
        await page.click('.buttonCont > input[type="submit"]');
        console.log("Waiting for new post layout");
        await page.waitForSelector('#create');
        await delay(1000);

        // Add a new post
        console.log("Adding new post");
        await page.click('#create');

        console.log("Stripping double line breaks");
        content = content.replace(/\r\n/g, "\n");

        try {
            console.log("Filling title");
            await page.type('#editor-body [name="changelog[title]"]', title);
            console.log("Filling body");
            await page.type('#editor-body [name="changelog[markdown]"]', content);
            console.log("Filling category");
            await page.select('#editor-body [name="changelog[category_id]"]', category.toString());

            if (process.env.HEADWAY_AUTO_PUBLISH) {
                console.log("Setting published flag to true");
                await page.evaluate(() => document.querySelector('#editor-body [name="changelog[published]"]').setAttribute('value', 1));
            }

            console.log("Saving");
            await page.waitForSelector('.save a');
            await delay(1000);
            console.log("Clicking");
            await page.click('.save a');

            console.log("Closing Browser");
            await browser.close();
        } catch (e) {
            console.log(e);
            tools.exit.failure("Unable to add changelog");
        }

        return resolve();
    });
}

function delay(d) {
    return new Promise((r) => setTimeout(r, d));
}
