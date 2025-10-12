import {
  CstParser,
  Lexer,
  type ILexingError,
  type IRecognitionException,
  type IToken,
  createToken,
} from "chevrotain";

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t\r\n]+/,
  group: Lexer.SKIPPED,
});

const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?\d+/,
});

const Colon = createToken({ name: "Colon", pattern: /:/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });
const SemiColon = createToken({ name: "SemiColon", pattern: /;/ });
const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
const RSquare = createToken({ name: "RSquare", pattern: /\]/ });

const JsonString = createToken({
  name: "JsonString",
  pattern: /'[^']*'/,
  line_breaks: true,
});

const Identifier = createToken({
  name: "Identifier",
  pattern: /[A-Za-z0-9_]+/,
});

const Create = createToken({ name: "Create", pattern: /create/, longer_alt: Identifier });
const Update = createToken({ name: "Update", pattern: /update/, longer_alt: Identifier });
const Delete = createToken({ name: "Delete", pattern: /delete/, longer_alt: Identifier });
const Get = createToken({ name: "Get", pattern: /get/, longer_alt: Identifier });
const List = createToken({ name: "List", pattern: /list/, longer_alt: Identifier });
const Move = createToken({ name: "Move", pattern: /move/, longer_alt: Identifier });

const NodeKeyword = createToken({ name: "NodeKeyword", pattern: /node/, longer_alt: Identifier });
const EdgeKeyword = createToken({ name: "EdgeKeyword", pattern: /edge/, longer_alt: Identifier });
const LayerKeyword = createToken({ name: "LayerKeyword", pattern: /layer/, longer_alt: Identifier });
const TreeKeyword = createToken({ name: "TreeKeyword", pattern: /tree/, longer_alt: Identifier });
const EdgeTypeKeyword = createToken({ name: "EdgeTypeKeyword", pattern: /edgetype/, longer_alt: Identifier });
const NodeTypeKeyword = createToken({ name: "NodeTypeKeyword", pattern: /nodetype/, longer_alt: Identifier });
const EdgeCategoryKeyword = createToken({ name: "EdgeCategoryKeyword", pattern: /edgecat/, longer_alt: Identifier });
const NodeCategoryKeyword = createToken({ name: "NodeCategoryKeyword", pattern: /nodecat/, longer_alt: Identifier });

const Repeat = createToken({ name: "Repeat", pattern: /repeat/, longer_alt: Identifier });
const For = createToken({ name: "For", pattern: /for/, longer_alt: Identifier });
const If = createToken({ name: "If", pattern: /if/, longer_alt: Identifier });
const End = createToken({ name: "End", pattern: /end/, longer_alt: Identifier });

const allTokens = [
  WhiteSpace,
  NumberLiteral,
  JsonString,
  Colon,
  Comma,
  SemiColon,
  LSquare,
  RSquare,
  Create,
  Update,
  Delete,
  Get,
  List,
  Move,
  Repeat,
  For,
  If,
  End,
  NodeKeyword,
  EdgeKeyword,
  LayerKeyword,
  TreeKeyword,
  EdgeTypeKeyword,
  NodeTypeKeyword,
  EdgeCategoryKeyword,
  NodeCategoryKeyword,
  Identifier,
];

const lexer = new Lexer(allTokens);

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class LangParser extends CstParser {
  public constructor() {
    super(allTokens, { recoveryEnabled: true });
    this.performSelfAnalysis();
  }

  public readonly script = this.RULE("script", () => {
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.statement);
    });
  });

  private readonly statement = this.RULE("statement", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.command) },
      { ALT: () => this.SUBRULE(this.metaCommand) },
    ]);
  });

  private readonly command = this.RULE("command", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.createTreeCommand) },
      { ALT: () => this.SUBRULE(this.createLayerCommand) },
      { ALT: () => this.SUBRULE(this.createNodeCategoryCommand) },
      { ALT: () => this.SUBRULE(this.genericCreateCommand) },
      { ALT: () => this.SUBRULE(this.nonCreateCommand) },
    ]);
  });

  private readonly createTreeCommand = this.RULE("createTreeCommand", () => {
    this.CONSUME(Create);
    this.CONSUME(TreeKeyword, { LABEL: "specifier" });
    this.SUBRULE(this.treeNameParameter);
    this.SUBRULE(this.treeSchemaParameter);
    this.OPTION(() => {
      this.SUBRULE(this.treePropsParameter);
    });
    this.CONSUME(SemiColon);
  });

  private readonly createLayerCommand = this.RULE("createLayerCommand", () => {
    this.CONSUME(Create);
    this.CONSUME(LayerKeyword, { LABEL: "specifier" });
    this.SUBRULE(this.layerNameParameter);
    this.SUBRULE(this.layerSchemaParameter);
    this.OPTION(() => {
      this.SUBRULE(this.layerPropsParameter);
    });
    this.CONSUME(SemiColon);
  });

  private readonly createNodeCategoryCommand = this.RULE("createNodeCategoryCommand", () => {
    this.CONSUME(Create);
    this.CONSUME(NodeCategoryKeyword, { LABEL: "specifier" });
    this.SUBRULE(this.nodeCategoryNameParameter);
    this.SUBRULE(this.nodeCategorySchemaParameter);
    this.CONSUME(SemiColon);
  });

  private readonly genericCreateCommand = this.RULE("genericCreateCommand", () => {
    this.CONSUME(Create);
    this.OR([
      { ALT: () => this.CONSUME(NodeKeyword, { LABEL: "specifier" }) },
      { ALT: () => this.CONSUME(EdgeKeyword, { LABEL: "specifier" }) },
      { ALT: () => this.CONSUME(EdgeTypeKeyword, { LABEL: "specifier" }) },
      { ALT: () => this.CONSUME(NodeTypeKeyword, { LABEL: "specifier" }) },
      { ALT: () => this.CONSUME(EdgeCategoryKeyword, { LABEL: "specifier" }) },
    ]);
    this.MANY(() => {
      this.SUBRULE(this.commandParameter);
    });
    this.CONSUME(SemiColon);
  });

  private readonly treeNameParameter = this.RULE("treeNameParameter", () => {
    this.CONSUME(Identifier, { LABEL: "nameKey" });
    this.CONSUME(Colon);
    this.CONSUME2(Identifier, { LABEL: "nameValue" });
  });

  private readonly treeSchemaParameter = this.RULE("treeSchemaParameter", () => {
    this.CONSUME(Identifier, { LABEL: "schemaKey" });
    this.CONSUME(Colon);
    this.CONSUME(JsonString, { LABEL: "schemaValue" });
  });

  private readonly treePropsParameter = this.RULE("treePropsParameter", () => {
    this.CONSUME(Identifier, { LABEL: "propsKey" });
    this.CONSUME(Colon);
    this.CONSUME(JsonString, { LABEL: "propsValue" });
  });

  private readonly layerNameParameter = this.RULE("layerNameParameter", () => {
    this.CONSUME(Identifier, { LABEL: "nameKey" });
    this.CONSUME(Colon);
    this.CONSUME2(Identifier, { LABEL: "nameValue" });
  });

  private readonly layerSchemaParameter = this.RULE("layerSchemaParameter", () => {
    this.CONSUME(Identifier, { LABEL: "schemaKey" });
    this.CONSUME(Colon);
    this.CONSUME(JsonString, { LABEL: "schemaValue" });
  });

  private readonly layerPropsParameter = this.RULE("layerPropsParameter", () => {
    this.CONSUME(Identifier, { LABEL: "propsKey" });
    this.CONSUME(Colon);
    this.CONSUME(JsonString, { LABEL: "propsValue" });
  });

  private readonly nodeCategoryNameParameter = this.RULE("nodeCategoryNameParameter", () => {
    this.CONSUME(Identifier, { LABEL: "nameKey" });
    this.CONSUME(Colon);
    this.CONSUME2(Identifier, { LABEL: "nameValue" });
  });

  private readonly nodeCategorySchemaParameter = this.RULE("nodeCategorySchemaParameter", () => {
    this.CONSUME(Identifier, { LABEL: "schemaKey" });
    this.CONSUME(Colon);
    this.CONSUME(JsonString, { LABEL: "schemaValue" });
  });

  private readonly nonCreateCommand = this.RULE("nonCreateCommand", () => {
    this.OR([
      { ALT: () => this.CONSUME(Update, { LABEL: "identifier" }) },
      { ALT: () => this.CONSUME(Delete, { LABEL: "identifier" }) },
      { ALT: () => this.CONSUME(Get, { LABEL: "identifier" }) },
      { ALT: () => this.CONSUME(List, { LABEL: "identifier" }) },
      { ALT: () => this.CONSUME(Move, { LABEL: "identifier" }) },
    ]);
    this.CONSUME(Identifier, { LABEL: "specifier" });
    this.MANY(() => {
      this.SUBRULE(this.commandParameter);
    });
    this.CONSUME(SemiColon);
  });

  private readonly commandParameter = this.RULE("commandParameter", () => {
    this.CONSUME(Identifier, { LABEL: "key" });
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(JsonString, { LABEL: "jsonValue" }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: "bareValue" }) },
      { ALT: () => this.CONSUME(NumberLiteral, { LABEL: "numberValue" }) },
    ]);
  });

  private readonly metaCommand = this.RULE("metaCommand", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.repeatMetaCommand) },
      { ALT: () => this.SUBRULE(this.conditionalMetaCommand) },
    ]);
  });

  private readonly repeatMetaCommand = this.RULE("repeatMetaCommand", () => {
    this.CONSUME(Repeat);
    this.SUBRULE(this.repeatParameterList);
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.command);
    });
    this.CONSUME(End);
    this.CONSUME2(SemiColon);
  });

  private readonly repeatParameterList = this.RULE("repeatParameterList", () => {
    this.CONSUME(LSquare);
    this.CONSUME(NumberLiteral, { LABEL: "count" });
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE(this.repeatArgument);
    });
    this.CONSUME(RSquare);
  });

  private readonly repeatArgument = this.RULE("repeatArgument", () => {
    this.OR([
      { ALT: () => this.CONSUME(JsonString, { LABEL: "jsonValue" }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: "bareValue" }) },
      { ALT: () => this.CONSUME(NumberLiteral, { LABEL: "numberValue" }) },
    ]);
  });

  private readonly conditionalMetaCommand = this.RULE("conditionalMetaCommand", () => {
    this.OR([
      { ALT: () => this.CONSUME(For, { LABEL: "keyword" }) },
      { ALT: () => this.CONSUME(If, { LABEL: "keyword" }) },
    ]);
    this.MANY(() => {
      this.SUBRULE(this.metaParameter);
    });
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.command);
    });
    this.CONSUME(End);
    this.CONSUME2(SemiColon);
  });

  private readonly metaParameter = this.RULE("metaParameter", () => {
    this.OR([
      { ALT: () => this.CONSUME(JsonString, { LABEL: "jsonValue" }) },
      { ALT: () => this.CONSUME(Identifier, { LABEL: "bareValue" }) },
      { ALT: () => this.CONSUME(NumberLiteral, { LABEL: "numberValue" }) },
    ]);
  });
}

const parserInstance = new LangParser();
const BaseVisitor = parserInstance.getBaseCstVisitorConstructor();

// ---------------------------------------------------------------------------
// AST definitions
// ---------------------------------------------------------------------------

export type CreateSpecifier =
  | "node"
  | "edge"
  | "layer"
  | "tree"
  | "edgetype"
  | "nodetype"
  | "edgecat"
  | "nodecat";
export type CommandKeyword = "update" | "delete" | "get" | "list" | "move";
export type ScalarValue = string | number;

export interface CommandParameter {
  key: string;
  value: ScalarValue;
}

export interface CreateCommand {
  kind: "create";
  specifier: CreateSpecifier;
  parameters: CommandParameter[];
}

export interface ActionCommand {
  kind: CommandKeyword;
  specifier: string;
  parameters: CommandParameter[];
}

export type CommandNode = CreateCommand | ActionCommand;

export interface RepeatMetaCommand {
  kind: "repeat";
  count: number;
  args: ScalarValue[];
  body: Statement[];
}

export type MetaParameter =
  | { kind: "string"; value: string }
  | { kind: "json"; value: string }
  | { kind: "number"; value: number };

export interface ConditionalMetaCommand {
  kind: "for" | "if";
  parameters: MetaParameter[];
  body: Statement[];
}

export type MetaCommandNode = RepeatMetaCommand | ConditionalMetaCommand;

export type Statement = CommandNode | MetaCommandNode;

export interface Script {
  statements: Statement[];
}

// ---------------------------------------------------------------------------
// CST visitor -> AST transformer
// ---------------------------------------------------------------------------

class LangVisitor extends BaseVisitor {
  public constructor() {
    super();
    this.validateVisitor();
  }

  public script(ctx: any): Script {
    const statements = (ctx.statement ?? []).map((statement: any) => this.visit(statement) as Statement);
    return { statements };
  }

  public statement(ctx: any): Statement {
    if (ctx.command) {
      return this.visit(ctx.command[0]) as CommandNode;
    }
    return this.visit(ctx.metaCommand![0]) as MetaCommandNode;
  }

  public command(ctx: any): CommandNode {
    if (ctx.createTreeCommand) {
      return this.visit(ctx.createTreeCommand[0]) as CreateCommand;
    }

    if (ctx.createLayerCommand) {
      return this.visit(ctx.createLayerCommand[0]) as CreateCommand;
    }

    if (ctx.createNodeCategoryCommand) {
      return this.visit(ctx.createNodeCategoryCommand[0]) as CreateCommand;
    }

    if (ctx.genericCreateCommand) {
      return this.visit(ctx.genericCreateCommand[0]) as CreateCommand;
    }

    return this.visit(ctx.nonCreateCommand![0]) as ActionCommand;
  }

  public createTreeCommand(ctx: any): CreateCommand {
    const nameParam = this.visit(ctx.treeNameParameter[0]) as CommandParameter;
    const schemaParam = this.visit(ctx.treeSchemaParameter[0]) as CommandParameter;
    const params: CommandParameter[] = [nameParam, schemaParam];

    if (ctx.treePropsParameter) {
      params.push(this.visit(ctx.treePropsParameter[0]) as CommandParameter);
    }

    return {
      kind: "create",
      specifier: "tree",
      parameters: params,
    };
  }

  public createLayerCommand(ctx: any): CreateCommand {
    const nameParam = this.visit(ctx.layerNameParameter[0]) as CommandParameter;
    const schemaParam = this.visit(ctx.layerSchemaParameter[0]) as CommandParameter;
    const params: CommandParameter[] = [nameParam, schemaParam];

    if (ctx.layerPropsParameter) {
      params.push(this.visit(ctx.layerPropsParameter[0]) as CommandParameter);
    }

    return {
      kind: "create",
      specifier: "layer",
      parameters: params,
    };
  }

  public createNodeCategoryCommand(ctx: any): CreateCommand {
    const nameParam = this.visit(ctx.nodeCategoryNameParameter[0]) as CommandParameter;
    const schemaParam = this.visit(ctx.nodeCategorySchemaParameter[0]) as CommandParameter;

    return {
      kind: "create",
      specifier: "nodecat",
      parameters: [nameParam, schemaParam],
    };
  }

  public genericCreateCommand(ctx: any): CreateCommand {
    const specifierToken = ctx.specifier[0];
    const specifier = specifierToken.image as CreateSpecifier;
    const parameters =
      ctx.commandParameter?.map((param: any) => this.visit(param) as CommandParameter) ?? [];

    return {
      kind: "create",
      specifier,
      parameters,
    };
  }

  public nonCreateCommand(ctx: any): ActionCommand {
    const identifierToken = ctx.identifier[0];
    const keyword = identifierToken.image as CommandKeyword;
    const parameters =
      ctx.commandParameter?.map((param: any) => this.visit(param) as CommandParameter) ?? [];

    return {
      kind: keyword,
      specifier: ctx.specifier[0].image,
      parameters,
    };
  }

  public commandParameter(ctx: any): CommandParameter {
    const key = ctx.key[0].image;
    const valueToken = (ctx.jsonValue ?? ctx.bareValue ?? ctx.numberValue)! [0];

    let value: ScalarValue;
    if (ctx.jsonValue) {
      value = parseJsonString(valueToken);
    } else if (ctx.bareValue) {
      value = valueToken.image;
    } else {
      value = Number(valueToken.image);
    }

    return { key, value };
  }

  public treeNameParameter(ctx: any): CommandParameter {
    const key = ctx.nameKey[0].image;
    if (key !== "name") {
      throw new Error(`Expected parameter key "name", received "${key}".`);
    }

    const value = ctx.nameValue[0].image;
    return { key, value };
  }

  public treeSchemaParameter(ctx: any): CommandParameter {
    const key = ctx.schemaKey[0].image;
    if (key !== "schema") {
      throw new Error(`Expected parameter key "schema", received "${key}".`);
    }

    const value = parseJsonString(ctx.schemaValue[0]);
    return { key, value };
  }

  public treePropsParameter(ctx: any): CommandParameter {
    const key = ctx.propsKey[0].image;
    if (key !== "props") {
      throw new Error(`Expected parameter key "props", received "${key}".`);
    }

    const value = parseJsonString(ctx.propsValue[0]);
    return { key, value };
  }

  public layerNameParameter(ctx: any): CommandParameter {
    const key = ctx.nameKey[0].image;
    if (key !== "name") {
      throw new Error(`Expected parameter key "name", received "${key}".`);
    }

    const value = ctx.nameValue[0].image;
    return { key, value };
  }

  public layerSchemaParameter(ctx: any): CommandParameter {
    const key = ctx.schemaKey[0].image;
    if (key !== "schema") {
      throw new Error(`Expected parameter key "schema", received "${key}".`);
    }

    const value = parseJsonString(ctx.schemaValue[0]);
    return { key, value };
  }

  public layerPropsParameter(ctx: any): CommandParameter {
    const key = ctx.propsKey[0].image;
    if (key !== "props") {
      throw new Error(`Expected parameter key "props", received "${key}".`);
    }

    const value = parseJsonString(ctx.propsValue[0]);
    return { key, value };
  }

  public nodeCategoryNameParameter(ctx: any): CommandParameter {
    const key = ctx.nameKey[0].image;
    if (key !== "name") {
      throw new Error(`Expected parameter key "name", received "${key}".`);
    }

    const value = ctx.nameValue[0].image;
    return { key, value };
  }

  public nodeCategorySchemaParameter(ctx: any): CommandParameter {
    const key = ctx.schemaKey[0].image;
    if (key !== "schema") {
      throw new Error(`Expected parameter key "schema", received "${key}".`);
    }

    const value = parseJsonString(ctx.schemaValue[0]);
    return { key, value };
  }

  public repeatMetaCommand(ctx: any): RepeatMetaCommand {
    const header = this.visit(ctx.repeatParameterList[0]) as { count: number; args: ScalarValue[] };
    const body = ctx.command.map((commandNode: any) => this.visit(commandNode) as Statement);
    return {
      kind: "repeat",
      count: header.count,
      args: header.args,
      body,
    };
  }

  public repeatParameterList(ctx: any): { count: number; args: ScalarValue[] } {
    const count = Number(ctx.count[0].image);
    const args =
      ctx.repeatArgument?.map((argument: any) => this.visit(argument) as ScalarValue) ?? [];
    return { count, args };
  }

  public repeatArgument(ctx: any): ScalarValue {
    if (ctx.jsonValue) {
      return parseJsonString(ctx.jsonValue[0]);
    }
    if (ctx.bareValue) {
      return ctx.bareValue[0].image;
    }
    return Number(ctx.numberValue![0].image);
  }

  public conditionalMetaCommand(ctx: any): ConditionalMetaCommand {
    const keywordToken = ctx.keyword[0];
    const kind = keywordToken.image as "for" | "if";
    const parameters =
      ctx.metaParameter?.map((param: any) => this.visit(param) as MetaParameter) ?? [];
    const body = ctx.command.map((statement: any) => this.visit(statement) as Statement);

    return {
      kind,
      parameters,
      body,
    };
  }

  public metaParameter(ctx: any): MetaParameter {
    if (ctx.jsonValue) {
      return { kind: "json", value: parseJsonString(ctx.jsonValue[0]) };
    }

    if (ctx.bareValue) {
      return { kind: "string", value: ctx.bareValue[0].image };
    }

    return { kind: "number", value: Number(ctx.numberValue![0].image) };
  }
}

const visitorInstance = new LangVisitor();

// ---------------------------------------------------------------------------
// Parsing API
// ---------------------------------------------------------------------------

export interface ParseResult {
  ast?: Script;
  lexerErrors: ILexingError[];
  parserErrors: IRecognitionException[];
}

export function parseScript(source: string): ParseResult {
  const lexResult = lexer.tokenize(source);
  parserInstance.reset();
  parserInstance.input = lexResult.tokens;
  const cst = parserInstance.script();
  const parserErrors = parserInstance.errors;

  if (lexResult.errors.length > 0 || parserErrors.length > 0) {
    return {
      lexerErrors: lexResult.errors,
      parserErrors,
    };
  }

  const ast = visitorInstance.visit(cst) as Script;
  return {
    ast,
    lexerErrors: lexResult.errors,
    parserErrors,
  };
}

// ---------------------------------------------------------------------------
// Execution skeleton
// ---------------------------------------------------------------------------

export abstract class ScriptExecutor {
  public execute(script: Script): void {
    for (const statement of script.statements) {
      this.executeStatement(statement);
    }
  }

  protected executeStatement(statement: Statement): void {
    switch (statement.kind) {
      case "create":
        this.executeCreate(statement);
        break;
      case "repeat":
        this.handleRepeat(statement);
        break;
      case "for":
        this.handleFor(statement);
        break;
      case "if":
        this.handleIf(statement);
        break;
      case "update":
      case "delete":
      case "get":
      case "list":
      case "move":
        this.executeAction(statement);
        break;
    }
  }

  protected executeCreate(command: CreateCommand): void {
    switch (command.specifier) {
      case "node":
        this.createNode(command.parameters);
        break;
      case "edge":
        this.createEdge(command.parameters);
        break;
      case "layer":
        this.createLayer(command.parameters);
        break;
      case "tree":
        this.createTree(command.parameters);
        break;
      case "edgetype":
        this.createEdgeType(command.parameters);
        break;
      case "nodetype":
        this.createNodeType(command.parameters);
        break;
      case "edgecat":
        this.createEdgeCategory(command.parameters);
        break;
      case "nodecat":
        this.createNodeCategory(command.parameters);
        break;
    }
  }

  protected executeAction(command: ActionCommand): void {
    switch (command.kind) {
      case "update":
        this.update(command.specifier, command.parameters);
        break;
      case "delete":
        this.delete(command.specifier, command.parameters);
        break;
      case "get":
        this.get(command.specifier, command.parameters);
        break;
      case "list":
        this.list(command.specifier, command.parameters);
        break;
      case "move":
        this.move(command.specifier, command.parameters);
        break;
    }
  }

  protected handleRepeat(command: RepeatMetaCommand): void {
    // Intentionally left blank.
  }

  protected handleFor(command: ConditionalMetaCommand): void {
    // Intentionally left blank.
  }

  protected handleIf(command: ConditionalMetaCommand): void {
    // Intentionally left blank.
  }

  protected createNode(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createEdge(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createLayer(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createTree(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createEdgeType(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createNodeType(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createEdgeCategory(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected createNodeCategory(_parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected update(_specifier: string, _parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected delete(_specifier: string, _parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected get(_specifier: string, _parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected list(_specifier: string, _parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected move(_specifier: string, _parameters: CommandParameter[]): void {
    // Intentionally left blank.
  }

  protected executeBlock(statements: Statement[]): void {
    for (const statement of statements) {
      this.executeStatement(statement);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJsonString(token: IToken): string {
  return token.image.slice(1, -1).replace(/\\'/g, "'");
}
