FROM node:slim

# Labels for GitHub to read your action
LABEL "com.github.actions.name"="Add Nexmo Changelog entry "
LABEL "com.github.actions.description"="Add a new entry to the Nexmo changelog on release"
# Here are all of the available icons: https://feathericons.com/
LABEL "com.github.actions.icon"="tag"
# And all of the available colors: https://developer.github.com/actions/creating-github-actions/creating-a-docker-container/#label
LABEL "com.github.actions.color"="yellow"

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .

ENTRYPOINT ["node", "/app/add-changelog.js"]
