//Only there for (multi) testing purposes : 
//      if you run tests that import from this package (easy-selenium)
//              typically `import { SeleniumServer } from "../..";`
//      Either they try to import following package.json 'main' field and end up in dist
//      Or -if dist not found- they will import from this index.ts file and end up in src
//
//      See 'file:///Users/apple/dev/notes/typescript/TypeScript_%20Documentation%20-%20Module%20Resolution.mht'
//          at paragraph 'How Node.js resolves modules'


//uncomment for use in testing
//export * from "./src/index";