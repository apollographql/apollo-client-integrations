---
applyTo: "**"
---

## Preamble

The rules in this document apply to all "documentation-style" content. That can be markdown files (`.md` or `.mdx`), JSDoc or TSDoc docblocks (`/** ... */`), Rust DocComments `/// ...`, Python docstrings (`""" ... """`), or any other similar format.

They do not need to be applied to code or to comments that are not intended for end users (e.g., comments in source code meant for developers working on the codebase). Examples of this would be JavaScript inline comments (`//`), normal JavaScript block comments (`/* ... */`), Python comments (`# ...`), or Rust comments (`//` or `/* ... */`).

---

### Primary Directive

Generate documentation content strictly adhering to the Apollo Voice and all rules in this guide.

---

### Voice

The Apollo voice is:

- Approachable
- Positive
- Encouraging
- Helpful
- Opinionated/Authoritative

Opinionated voice prescribes a specific "happy path" to accomplish a goal.

Do this: "To achieve optimal performance, configure your server with X."
Do this: "The recommended approach is to use Apollo Federation for scaling."
Do this: "Always secure your GraphQL endpoint using authentication."
Don't do this: "You can configure your server with X, Y, or Z." Reason: This is unopinionated and lays out options rather than prescribing a path.
Don't do this: "There are several ways to scale, including Federation or stitching." Reason: This is unopinionated and presents multiple options without guiding the user.
Don't do this: "Consider securing your GraphQL endpoint; options include authentication and authorization." Reason: This is unopinionated and doesn't prescribe a specific security measure.

The Apollo voice is not:

- Sarcastic
- Condescending
- Robotic
- Exaggerated
- Unopinionated

**Guiding Principle:** Communicate as if with a coworker you haven't met yet.

---

### Language

- **Spelling and Grammar:** Use American English.
  Do this: "The request is canceled."
  Do this: "The client is customizing their schema."
  Do this: "The solution centralizes data management."
  Don't do this: "The request is cancelled." Reason: Uses British English spelling.
  Don't do this: "The client is customising their schema." Reason: Uses British English spelling.
  Don't do this: "The solution centralises data management." Reason: Uses British English spelling.
- **Simplicity:** Keep language simple and avoid idioms.
  Do this: "The client's query was very fast."
  Do this: "This feature makes development easier."
  Do this: "The system is now fully functional."
  Don't do this: "The client's query was lightning fast." Reason: Uses an idiom that may not be understood by non-native English speakers.
  Don't do this: "This feature is a piece of cake for developers." Reason: Uses an idiom.
  Don't do this: "The system is now firing on all cylinders." Reason: Uses an idiom.

---

### Framing

- **Reader-Centric:** Frame content relative to the reader ("you/your", "your team/organization", "your users/customers"). This includes the imperative.
  Do this: "Your API key is located in the settings."
  Do this: "You can configure your schema to meet your organization's needs."
  Do this: "This guide helps your team integrate Apollo Client."
  Don't do this: "Our API key is located in the settings." Reason: Blurs responsibility, unclear if "our" refers to Apollo or the reader's team.
  Don't do this: "One can configure their schema to meet their organization's needs." Reason: Uses an impersonal pronoun ("one") instead of directly addressing the reader.
  Don't do this: "This guide helps us integrate Apollo Client." Reason: Uses "us," which can blur responsibility or imply Apollo is doing the integration.

- **Imperative:** Use imperative verbs for instructions.
  Do this: "Connect to your GraphQL server."
  Do this: "Deploy your subgraph."
  Do this: "Save the changes."
  Don't do this: "You should connect to your GraphQL server." Reason: Less direct and less actionable than imperative.
  Don't do this: "Your subgraph needs to be deployed." Reason: Passive and less direct.
  Don't do this: "The changes can be saved." Reason: Less direct and lacks urgency.

- **Avoid "We":** Do not use "we" or other 1st person language unless it is unambiguously clear that "we" refers to "Apollo." When in doubt, use "Apollo."
  Do this: "Apollo recommends using managed federation."
  Do this: "When you use Apollo Client, we ensure robust caching." (Acceptable in this context where "we" clearly refers to Apollo as the provider.)
  Do this: "We've created this tool to help you." (Acceptable in introductory or product overview contexts where "we" is the company.)
  Don't do this: "We configured the server in the next step." Reason: Unclear if "we" refers to the reader or Apollo, blurring responsibility.
  Don't do this: "First, we add the dependency." Reason: Unclear who "we" refers to, implies reader is part of "we."
  Don't do this: "We then check the status of the request." Reason: Unclear who "we" refers to, implies reader is part of "we."

---

### Verb Tense and Voice

- **Present Tense:** Favor the present tense.
  Do this: "The client then sends a request to the server."
  Do this: "This feature retrieves data instantly."
  Do this: "The function returns a promise."
  Don't do this: "The client will then send a request to the server." Reason: Future tense is longer and rarely provides more clarity.
  Don't do this: "This feature will retrieve data instantly." Reason: Future tense is longer.
  Don't do this: "The function will return a promise." Reason: Future tense is longer.

- **Active Voice:** Favor the active voice for clarity and brevity.
  Do this: "The client then sends a request to the server."
  Do this: "Apollo Studio manages your graph."
  Do this: "You install the package using npm."
  Don't do this: "A request is then sent to the server by the client." Reason: Passive voice is less direct and longer.
  Don't do this: "Your graph is managed by Apollo Studio." Reason: Passive voice.
  Don't do this: "The package is installed by you using npm." Reason: Passive voice.

- **Passive Voice Exceptions:** Passive voice is acceptable in these cases:
  - To emphasize an object over an action.
    Do this: "The file is saved."
    Do this: "The data was updated."
    Do this: "The error was logged."
    Don't do this: "The save action is performed on the file." Reason: Active voice is clearer and more concise here ("You save the file").
    Don't do this: "The update operation was performed on the data." Reason: Active voice is clearer ("The system updated the data").
    Don't do this: "The logging process captured the error." Reason: Active voice is clearer ("The system logged the error").
  - To de-emphasize a subject or actor.
    Do this: "Over 50 conflicts were found in the file."
    Do this: "New features were deployed last week."
    Do this: "The database was purged in January."
    Don't do this: "You created over 50 conflicts in the file." Reason: Placing responsibility on the reader might be discouraging or irrelevant.
    Don't do this: "Our engineering team deployed new features last week." Reason: The actor ("Our engineering team") is not necessary for the reader to know.
    Don't do this: "The administrator purged the database in January." Reason: The actor is not necessary for the reader to know.

---

### Framing Apollo Products

- **Advantages Focus:** When comparing Apollo/GraphQL to an alternative, emphasize Apollo/GraphQL's advantages more than the alternative's disadvantages.
  Do this: "GraphQL allows clients to request exactly the data they need, reducing over-fetching."
  Do this: "Apollo Federation simplifies scaling complex microservices architectures."
  Do this: "With Apollo Client, you get robust caching and state management out of the box."
  Don't do this: "REST APIs often lead to over-fetching, unlike GraphQL." Reason: Focuses on the disadvantage of an alternative, which is less positive.
  Don't do this: "Without Federation, scaling microservices can be extremely difficult." Reason: Focuses on the problem rather than the solution's benefit.
  Don't do this: "Other clients lack the comprehensive caching that Apollo Client offers." Reason: Focuses on competitors' shortcomings, which is less positive.

- **Colloquial Language:** Use simpler or more colloquial language to describe adopting or using Apollo products and features.
  Use: "adopt", "move", "use", "enable"
  Avoid: "migrate", "transition", "utilize", "leverage"
  ("Migrate" is OK when it's the most technically accurate option, like with database migrations, or common/accepted, like "Migration guide".)

  Do this: "Use Apollo Server to get started quickly."
  Do this: "Enable the feature in your settings."
  Do this: "Your team can adopt GraphQL gradually."
  Don't do this: "Utilize Apollo Server to get started quickly." Reason: "Utilize" is overly formal; "use" is simpler.
  Don't do this: "Leverage the feature in your settings." Reason: "Leverage" is corporate jargon; "enable" is clearer.
  Don't do this: "Your team can transition to GraphQL gradually." Reason: "Transition" is less direct; "adopt" is simpler.

- **Encouraging Tone (without condescension):** Encourage without condescending.
  Do this: "Apollo Client helps you fetch GraphQL data."
  Do this: "This guide empowers you to connect your client effectively."
  Do this: "Setting up authentication is straightforward with these steps."
  Don't do this: "Apollo Client makes data fetching trivial." Reason: "Trivial" is condescending; it implies the task is easy for everyone.
  Don't do this: "Connecting your client is incredibly easy, even for beginners." Reason: "Incredibly easy" is condescending.
  Don't do this: "Anyone can set up authentication; it's a breeze." Reason: "A breeze" is condescending and oversimplifies the task.

- **Avoid "Simply":** Avoid phrases like "simply" or "as easy as" when describing a task.
  Do this: "Configure the `ApolloServer` instance."
  Do this: "Follow these steps to deploy your graph."
  Do this: "The process involves modifying your schema."
  Don't do this: "Simply configure the `ApolloServer` instance." Reason: Implying a task is "simple" can frustrate and insult readers if they find it difficult.
  Don't do this: "Deploying your graph is as easy as following these steps." Reason: Implying a task is "easy" can frustrate and insult readers if they find it difficult.
  Don't do this: "The process simply involves modifying your schema." Reason: Implying a task is "simple" can frustrate and insult readers if they find it difficult.

---

### Structural Elements

#### Titles

Each page must have a title. Use title casing. A title should be 50 characters or less.
Do this: "Building a Federated Graph"
Do this: "Getting Started with Apollo Client"
Do this: "Deploying to Production"
Don't do this: "Building a Federated Graph with Multiple Subgraphs and Advanced Directives" Reason: Too long.
Don't do this: "getting started with apollo client" Reason: Incorrect casing.
Don't do this: "Deployment Guide" Reason: Too generic; titles should be more specific.

#### Subtitles

Each page should have a subtitle. Use sentence casing. Do not add a period. A subtitle is a single phrase or clause related to the page’s title and describes its purpose or outcome. For conceptual pages, subtitles can start with “Learn.” For tutorials, start with a verb other than “learn.” A subtitle should be 70 characters or less.

Do this (Conceptual): "Learn how GraphQL Federation works"
Do this (Tutorial): "Connect to your GraphQL server from a React app"
Do this (Conceptual): "Understand the benefits of client-side caching"
Don't do this: "How GraphQL Federation Works." Reason: Has a period.
Don't do this: "Learning to connect your GraphQL server" Reason: Starts with "Learning" for a tutorial; should be an imperative verb.
Don't do this: "An in-depth guide to understanding the various intricacies of client-side caching mechanisms and their implications for performance" Reason: Too long and overly descriptive.

#### Descriptions

The “description” attribute in a page’s frontmatter is the meta description used for SEO. Include general GraphQL terms when sensible. Descriptions can incorporate aspects of titles and subtitles. A description should be 158 characters or less.

Do this: "Learn how to build and scale your GraphQL API with Apollo Federation. Understand subgraphs, the router, and schema composition."
Do this: "Configure Apollo Client for your React application. Set up caching, operations, and error handling for robust GraphQL apps."
Do this: "Discover Apollo Studio features for GraphQL development. Monitor queries, manage schemas, and collaborate with your team."
Don't do this: "This page explains how to use Apollo. It is very useful and has lots of information about GraphQL APIs and tools." Reason: Vague and not optimized for SEO keywords.
Don't do this: "Apollo Federation is a powerful architecture for building scalable GraphQL APIs. It enables you to combine multiple independent GraphQL services into a single unified graph, simplifying development and improving performance across large teams and complex systems. Learn about subgraphs, gateways, schema composition, and graph management to build your next-generation API." Reason: Exceeds character limit.
Don't do this: "Building scalable APIs." Reason: Too short and lacks sufficient detail for SEO.

#### Headings

Organize content with headings and subheadings for scannability. Use sentence casing for all headings. All “sibling” headings should follow a similar titling strategy.

**Heading Phrase Type by Document Type:**

- **Conceptual Overview:** Use Gerunds. Example: "Connecting to the server", "Executing jobs"
- **Tutorial (How to):** Use Imperative verbs. Example: "Build a paginated list", "Update data with useMutation"
- **Reference (API and otherwise):** Use Nouns (usually the name of a class, function, or other Apollo-specific term). Example: "The ApolloServer constructor", "useQuery()"

Do this (Consistent Imperative for Tutorial):
`### Connect to your graph`
`### Execute a query`
`### Add authentication`
Don't do this (Inconsistent):
`## Connecting to your graph`
`## How to execute a query`
`## Authentication` Reason: Mixes gerund, question/how-to, and noun phrases at the same level.

#### Lists

- **Unordered Lists:** Use to enumerate short, related items that don’t have multiple fields.
  - Introduce the list with a sentence or fragment that ends in a colon. Do not specify how many items are in the list.
    Do this: "The `cache` option supports the following fields:"
    Do this: "Consider these best practices when structuring your schema:"
    Do this: "Your project requires several dependencies:"
    Don't do this: "The `cache` option supports 3 fields:" Reason: Specifies the number of items, which might change.
    Don't do this: "Here are some best practices for schema structuring." Reason: Does not end with a colon.
    Don't do this: "These are your project's dependencies." Reason: Does not end with a colon.
  - Keep list items short for scannability.
  - Use structurally similar phrases or clauses for each list item.
    Do this (Fragment items):
    - Configure the client
    - Define your schema
    - Run the server
      Don't do this (Mixed/Long):
    - Configure the client for caching.
    - Defining your schema requires careful thought and should involve all team members for collaboration and future scalability planning.
    - You should run the server locally to test. Reason: Inconsistent structure and length of items.
  - Use sub-items sparingly to clarify more complex list items.
  - If a list exceeds 6 items, consider splitting it.
  - **Punctuation:**
    - If each list item is a complete sentence, include ending punctuation.
      Do this:
      - Ensure the server is running.
      - Verify the API key.
      - Check network connectivity.
        Don't do this:
      - Ensure the server is running
      - Verify the API key
      - Check network connectivity Reason: Missing punctuation for complete sentences.
    - If each list item is a fragment, omit ending punctuation.
      Do this:
      - Server configuration
      - Schema definition
      - Client setup
        Don't do this:
      - Server configuration.
      - Schema definition.
      - Client setup. Reason: Punctuation used for fragments.
  - **Markdown Syntax:** Use hyphens (-) to denote a list bullet.
    Do this:
    ```markdown
    - Item one
    - Item two
    ```
    Don't do this:
    ````markdown
    - Item one
    - Item two
      ```Reason: Uses`\*`instead of`-` for bullet points.
    ````

- **Ordered Lists:** Use only when describing an ordered sequence of steps, such as in a tutorial. In all other cases, use an unordered list.

#### Tables

Use a table to enumerate related items that have multiple fields (e.g., function parameters, object fields).

#### Code Blocks

Content that must go in a code block: example code, terminal commands longer than three words (short commands like "Run `npm start`" can be inline), example terminal and logging output.

- Specify the example’s programming language for syntax highlighting.
  Do this:
  ```javascript
  const server = new ApolloServer({});
  ```
  Don't do this:
  ````
  const server = new ApolloServer({});
  ``` Reason: Missing language specifier for syntax highlighting.
  ````
- Indicate omitted code with language-specific comments rather than ellipses.
  Do this (JS):
  ```javascript
  function fetchData() {
    // ... fetch logic here
    return result;
  }
  ```
  Don't do this (JS):
  ````javascript
  function fetchData() {
    ...
    return result;
  }
  ``` Reason: Uses ellipses instead of a language-specific comment.
  ````
- Follow specific style guides for that language (e.g., Google's JavaScript style guide).
- Wrap lines at 80 characters for readability.
- Remove line numbering with `showLineNumbers=false` for terminal commands, outputs, or other unhelpful samples.
- Include required import statements in the first code block of an article. Do not repeat imports unless an additional import is required. Avoid importing unused libraries.
- The first code block demonstrating an API should demonstrate just above the bare minimum.
- Limit the increase in complexity for each subsequent code block.
- Use in-block comments to document important individual lines.
- Give symbols expressive, relevant names.
  Do this:

  ```javascript
  const server = new ApolloServer();
  let userCount = 0;
  ```

  Do this:

  ```typescript
  interface Product {
    id: string;
    name: string;
  }
  ```

  Don't do this:

  ````javascript
  const foo = new ApolloServer();
  let x = 0;
  ``` Reason: `foo` and `x` are unexpressive and generic names.
  Don't do this:
  ```typescript
  interface Data { // Too generic
    a: string;
    b: string;
  }
  ``` Reason: `Data` is too generic, and `a`/`b` are unexpressive.

  ````

- Avoid symbol names that might have an overloaded meaning in software development.
  Do this:

  ```javascript
  professor.course = "Biology 101";
  ```

  Do this:

  ```javascript
  user.department = "Engineering";
  ```

  Don't do this:

  ````javascript
  professor.class = 'Biology 101';
  ``` Reason: `class` has an overloaded meaning (OOP class, HTML class attribute).
  Don't do this:
  ```javascript
  const process = new Process();
  ``` Reason: `process` is a global object in Node.js, leading to potential confusion or conflicts.

  ````

- **Indentation:**
  - Use spaces instead of tabs.
    Do this (JS):
    ```javascript
    function foo() {
      if (true) {
        console.log("bar");
      }
    }
    ```
    Don't do this (JS):
    ````javascript
    function foo() {
    	if (true) {
    		console.log('bar');
    	}
    }
    ``` Reason: Tabs are interpreted differently by various text editors, leading to inconsistent display.
    ````
  - For most programming languages, use two spaces for each indentation level.
    Do this (JS):
    ```javascript
    function foo() {
      console.log("bar");
    }
    ```
    Don't do this (JS):
    ````javascript
    function foo() {
        console.log('bar'); // 4 spaces
    }
    ``` Reason: Deviates from the standard two-space indentation for JavaScript in these docs.
    ````
  - Comments should match the current indentation level and preferably be written above the line they apply to.
  - **YAML-Specific Indentation:** Use exactly 2 spaces for indentation.
    Do this:
    ```yaml
    services:
      my_service:
        image: "my-image:latest"
    ```
    Don't do this:
    ````yaml
    services:
      my_service:
      image: "my-image:latest" # Only 0 spaces for image
    ``` Reason: Incorrect indentation for `image` (should be 4 spaces relative to `services` or 2 relative to `my_service`).
    Don't do this:
    ```yaml
    services:
        my_service: # 4 spaces for my_service
          image: "my-image:latest"
    ``` Reason: Incorrect indentation for `my_service` (should be 2 spaces relative to `services`).
    ````

#### Images

Use images only when they provide useful visual explanations or for UI screenshots important to the discussion. Avoid overuse.

**UI Screenshots Specifics:**

- Use them sparingly. UI is prone to frequent change.
- Do not include irrelevant or potentially confidential information (e.g., browser tabs). If confidential, use a blur component.
  Do this: A screenshot showing only the specific "New Graph" button within the Apollo Studio UI, with no surrounding browser tabs or personal data.
  Do this: A blurred section over an API key in a screenshot.
  Don't do this: A full browser screenshot showing browser history, bookmarks, and other open tabs. Reason: Includes irrelevant and potentially private information.
  Don't do this: A screenshot that exposes an unblurred API key or confidential server IP address. Reason: Exposes sensitive information.
- Include only as much of the UI as is necessary.
  Do this: A cropped screenshot focusing solely on a dropdown menu you're instructing users to click.
  Do this: A narrow screenshot showing only the relevant form fields for a configuration.
  Don't do this: A screenshot of the entire Apollo Studio dashboard just to point out the "Settings" icon. Reason: Includes too much irrelevant UI, making the image cluttered and less focused.
  Don't do this: A wide screenshot including sidebars and footers when only the main content area is relevant. Reason: Excess visual information distracts from the primary point.
- Annotations within images should be used even more sparingly. If you need to use annotations, use shared ones from Figma.
  - Do not add text annotations. Rely on captions instead.
  - Do not add rectangles or circles to highlight parts of the UI. Use text to describe an item’s location if possible. If a callout with larger visual context is needed, use an overlay component.
    Do this: "Click the **Save** button in the top right corner." (using text to describe location)
    Do this: A clear image with a descriptive caption, "Figure 1: The `New Graph` button initiates graph creation." (relying on caption)
    Don't do this: A screenshot with red circles drawn around buttons or text. Reason: Annotations add maintenance burden and can look unprofessional.
    Don't do this: A screenshot with overlaid text like "Click HERE!" or "This is the button." Reason: Overlaid text is difficult to maintain and less accessible.

- Use .jpg files for images unless transparency is required (rare). Scale images wider than 1000px down to 1000px.

#### Videos

If possible, use `<YouTube>` or `<WistiaEmbed>` components rather than an `<iframe>`. Consider embedding the video in an `<ExpansionPanel>` to reduce visual prominence.

#### Callouts/Admonitions

Draw attention to important information using an admonition. Admonitions are designed to catch readers' attention and break the flow of the text. They're helpful to make a piece of information stand out, but should be used wisely and sparingly. Use them only for information that shouldn't be missed.

The following admonition components are available:

- `<Caution>`
- `<Note>`
- `<Tip>`

You can use `<Caution>`, `<Note>`, and `<Tip>` components directly in `.mdx` pages. Examples below, with guidelines on when to use each:

```mdx
<Caution>

`<Caution>` admonitions generate anxiety. Never use them for anything other than highly important information which may cause serious issues if not acknowledged. Most of the time, prefer `<Note>`s.

</Caution>

<Note>

`<Note>` admonitions are the most common. You can generally use them whenever you find yourself starting a sentence with "_Note_,..." or "_Keep in mind_...".

Avoid using `<Note>`s directly one after another—condense notes if it makes sense.

</Note>

<Tip>

Use `<Tip>` admonitions for any particularly helpful advice or suggestions.

</Tip>
```

Be sure to include two newlines between the admonition components and content and as shown in the examples above.

### Text Formatting

- **Links:** Avoid using “here”, “this page”, or similarly vague phrases as link display text. Use a rich noun or verb phrase suggesting the linked content. If the linked page has a title, that's often best. Add links to the end of a sentence if sentence structure allows.
  Do this: "For details, see our pricing page."
  Do this: "Learn more about configuring the Apollo Client cache."
  Do this: "Explore the `useQuery` hook documentation."
  Don't do this: "See this page for pricing details." Reason: "This page" is vague and uninformative as link text.
  Don't do this: "Click here for more information." Reason: "here" is vague and not descriptive.
  Don't do this: "You can read about the `useQuery` hook here." Reason: "here" is vague and less specific than linking the hook name directly.

- **Code Font (` `):** Use code font when mentioning:
  - Any symbol that appears in code (keywords, class names, variables, functions). Do not surround strings in quotes.
    Do this: The `ApolloServer` constructor accepts an `options` object.
    Do this: Define a `name` field of type `String`.
    Don't do this: The ApolloServer constructor accepts an "options" object. Reason: Strings within code font should not be quoted.
    Don't do this: Define a name field of type String. Reason: Missing code font for a symbol.
  - CLI commands (e.g., `npm start`) or command names (e.g., "the `npm` command").
    Do this: Run `npm install` to update dependencies.
    Do this: Use the `rover` command to manage your graph.
    Don't do this: Run npm install to update dependencies. Reason: Missing code font for a CLI command.
    Don't do this: Use the "rover" command to manage your graph. Reason: Uses quotes instead of code font.
  - Any value a user inputs into a terminal (e.g., `0`, `yes`, `MyFirstProject`, `CTRL+C`).
    Do this: Enter `yes` to confirm.
    Do this: Press `CTRL+C` to exit.
    Don't do this: Enter yes to confirm. Reason: Missing code font for user input.
    Don't do this: Press CTRL+C to exit. Reason: Missing code font for a key combination.
  - File paths (e.g., `src/index.js`).
    Do this: The main file is `src/index.js`.
    Do this: Open `config/apollo.yaml`.
    Don't do this: The main file is src/index.js. Reason: Missing code font for a file path.
  - Non-link URLs (e.g., `http://localhost:8000`).
    Do this: Navigate to `http://localhost:4000`.
    Do this: The GraphQL playground is at `http://localhost:8080/graphql`.
    Don't do this: Navigate to http://localhost:4000. Reason: Missing code font for a URL.

- **Bold (`**text**`):** Use bold for the name of a button or other labeled interactive element that a user clicks (e.g., "Click **Save**.").
  - Exceptions: Calling out user roles (**Contributor**, **Graph admin**); differentiating items in an unordered list.
  - Do not use for any other cases, including emphasizing text. If a legacy bolding is found for emphasis, remove it.
    Do this: Click the **New Graph** button.
    Do this: Select **Save Changes** to apply.
    Don't do this: This is a **crucial** step for your deployment. Reason: Do not use bold for general emphasis.
    Don't do this: Click the _New Graph_ button. Reason: Incorrect formatting (italics instead of bold).

- **Italics (`_text_`):** Do not use for emphasizing text. If a legacy italicization is found for emphasis, remove it.
  Don't do this: This _important_ step must be completed first. Reason: Do not use italics for general emphasis.

- **Underline:** Do not use underlines.

- **Version Numbers:** State version numbers with a "v" and no space, e.g., `v#.#.#`. Use plain text, not code font, italics, or any other formatting.

---

### Products and Features

- Never use articles or possessives in front of standalone, proper product/feature names, unless the product/feature has an article in the name.
  Do this: "Apollo Server can handle over ten queries per second."
  Do this: "Apollo Client provides robust caching."
  Do this: "The Rover CLI is highly extensible."
  Don't do this: "The Apollo Server can handle over ten queries per second." Reason: "The" is not part of the product name "Apollo Server."
  Don't do this: "Your Apollo Client provides robust caching." Reason: "Your" is a possessive before a standalone product name.
- Use articles and possessives in front of components of a product, where appropriate.
  Do this: "Obtain an API key from the Studio settings page."
  Do this: "Configure the Graph Manager dashboard."
  Don't do this: "Obtain an API key from Studio settings page." Reason: Missing "the" before "Studio settings page," which is a component.
- Treat product/feature names ending in -s as plural subjects.
  Do this: "Apollo Connectors are easy to use."
  Do this: "Apollo Tools provide comprehensive support."
  Don't do this: "Apollo Connectors is easy to use." Reason: "Connectors" is plural, so it should use a plural verb.

---

### Word and Symbol Usage

#### Punctuation

- **Oxford/Serial Comma:** Use the Oxford/serial comma for lists of three or more items.
  Do this: "The server supports queries, mutations, and subscriptions."
  Do this: "You will need a schema, resolvers, and a data source."
  Don't do this: "The server supports queries, mutations and subscriptions." Reason: Missing the Oxford comma before "and."
- **Semicolons:** Avoid semicolons, except where valid syntax in code blocks.
  Do this: "The client sends the request, and the server responds."
  Do this: "The process is complete. Now, configure the next step."
  Don't do this: "The process is complete; now, configure the next step." Reason: A semicolon is typically used to join two closely related independent clauses, but often a period and new sentence is clearer.

#### Numbers

- When referring to a number that’s used in code or a CLI command, always use numerals and always apply code font.
  Do this: "If the command succeeds, it returns `0`."
  Do this: "Set the timeout to `5000` milliseconds."
  Don't do this: "If the command succeeds, it returns zero." Reason: Numbers in code/CLI context should be numerals with code font.
- In other cases, use words for "zero" through "ten" for their corresponding integers, and use numerals without code font for other values.
  Do this: "There are three types of GraphQL operations."
  Do this: "The request times out after 90 seconds."
  Don't do this: "There are 3 types of GraphQL operations." Reason: Numbers one through ten should be written as words in general prose.

#### Emoji

Specific emoji usage for clarity:

- `❌`: Indicates incorrect example usage; indicates unsupported in a support matrix.
- `✅`: Indicates correct example usage.
- `🟢`: Used in a support matrix to indicate supported.

#### Contractions

Use dictionary-valid contractions wherever applicable. Negation contractions are particularly useful for readability. If strong emphasis on the negative is required, use text formatting such as "is _not_".
Do this: "Don't forget to save your changes."
Do this: "It's important to understand the schema."
Don't do this: "Do not forget to save your changes." Reason: Negation contractions improve readability and are less likely to be missed.
Don't do this: "It is important to understand the schema." Reason: Contractions make text more natural and concise.

#### Spelling for Common Terms

- `backend`: Not "back-end"
- `backward compatible`: Not "backwards compatible". Use "backward-compatible" when placed in front of the noun it modifies (e.g., "a backward-compatible solution").
- `click the`: Not "click on the". Example: "Click the button to..."
- `CTRL+C`: Use this format for key combinations.
- `curl`: Not "cURL". Don't use as a verb. Instead say "run the following curl command".
- `dialog`: Not "dialogue".
- `Enterprise plan`: Not "free plan" or "Free Plan". Don't put quotation marks around plan names.
- `Free plan`: Use "Free plan", not "free plan" or "Free Plan".
- `frontend`: Not "front-end".
- `Git / git`: "Git" is the name of the tool, "git" is the name of the command.
- `graph`: Not "Graph" or "data graph".
- `GraphQL`: Not Graphql, graphQl, or Graph-QL.
- `homepage`: Not "home page".
- `ID / id / ID`: Use ID (no codefont) when referring generically to something's identifier. Use `id` when referring to a GraphQL field with that name. Use `ID` when referring to the GraphQL scalar.
- `iOS`: Apple's mobile operating system.
- `JavaScript`: Not "javascript" or "Javascript".
- `localhost`: Always use codefont.
- `log in / login`: "log in" is a verb, "login" is a noun. "You log in to something", not "log into something".
- `log out / logout`: See "log in".
- `macOS`: Apple's desktop operating system.
- `Node.js`: Not "Node" or "NodeJS".
- `Serverless plan`: Use "Serverless plan".
- `set up / setup`: "set up" is a verb, "setup" is a noun. Do not separate "set" and "up" (i.e., "set up your application", NOT "set your application up").
- `single sign-on (SSO)`: After first use, can use "SSO".
- `string / string / String`: "string" OK when discussing the nature of a value within prose. When defining a field or argument type in API reference, use `string` or `String` as appropriate (e.g., JS/TS `string`).
- `Team plan`: Use "Team plan".
- `toward`: Not "towards".
- `URL`: Not "Url" or "url" unless name of a code symbol (use code font). Always "a" URL, not "an" URL.

#### Discouraged Words and Replacements

Avoiding these words helps increase readability and reduce ambiguity, especially for non-native English readers.

- Avoid `above` / `below`; use `preceding` / `following` for body text. For UI, rewrite without directional language.
- Avoid `allow`; use `enable` when referring to other functionality a feature provides.
- Avoid `may`; use `might` (for potential occurrence) or `can` (for capability).
- Avoid `utilize`; use `use`.
- Avoid `leverage`; use `use`.
- Avoid `implement`; use `perform` or `provide` (for code actions), `build` or `add` (for person actions). OK for interfaces, libraries that "implement a spec".
- Avoid `while` (if synonyms with `although`); use `although`. Avoid if contrasted phrases aren't happening simultaneously.
- Avoid `since` (if synonyms with `because`); use `because`.
- Avoid `as` (if synonyms with `because`); use `because`.
- Avoid `rather than`; use `instead of`.
- Avoid `chance`; use `opportunity` (if synonyms), `possibility` or `risk`.
- Avoid `once` (if synonyms with `after`); use `after`.
- Avoid `at once`; use `at the same time` or `immediately`.
- Avoid `compose` / `composition` (unless referring to federated schema composition); use `build`, `configure`, or `construct` elsewhere.
- Avoid `declare` (unless for code variables); use `define` (when adding a definition to a GraphQL schema).
- Avoid `flesh out`; use `complete` or `expand`.
- Avoid `foo` / `bar`; use variable names that indicate the purpose.
- Avoid `folder` (unless describing GUI actions); use `directory`.
- Avoid `just`; use `only`.
- Avoid `lower` (as a verb); use `reduce`. OK as comparative adjective.
- Avoid `several` / `a couple`; use `multiple` (not singular), `many` (a lot), `a few` (small list).
- Avoid `turn into`; use `transform into`.
- Avoid `thing`; use a more specific noun.

---

### Changesets

Changeset descriptions answer WHAT, WHY, and HOW a consumer should update their code, concisely. Focus on information useful for future developers or code reviews. Additional details belong in the main Apollo documentation.

**Changeset Guidelines:**

- Use the imperative tense for the changeset title.
  Do this: "Add selector for router service"
  Do this: "Prevent panic in schema composition"
  Do this: "Improve subgraph health check logic"
  Don't do this: "Added selector for router service" Reason: Not imperative tense.
  Don't do this: "Fixed critical bug in schema composition" Reason: Not imperative tense.
  Don't do this: "Selector for router service" Reason: Not a verb phrase.
- **Describe the outcome or behavior change, not the fix itself.**
  Do this: "Prevent null pointer dereference in query planning"
  Do this: "Ensure schema validation catches circular references"
  Do this: "Return proper error codes for malformed requests"
  Don't do this: "Fix bug in query planner" Reason: Describes the action of fixing, not what changed.
  Don't do this: "Fix schema validation" Reason: Vague and doesn't describe the actual improvement.
  Don't do this: "Fix error handling" Reason: What specifically improved about error handling?
- **Omit category prefixes from titles — the changeset type already categorizes it.**
  Do this: "Update telemetry configuration examples" (in Docs section)
  Do this: "Upgrade prometheus-client to 0.14" (in Maintenance section)
  Don't do this: "Docs: Update telemetry configuration examples" Reason: Redundant with section.
  Don't do this: "Maintenance: Upgrade prometheus-client" Reason: Category already indicated.
- For large changesets, use bullet points or lists to break down the description.
- Include links to relevant Apollo documentation or other relevant references. PR and issue links should automatically be included.
- Follow general style guide principles.
