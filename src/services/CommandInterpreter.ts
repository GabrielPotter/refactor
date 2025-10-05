import { CstNode, CstParser, IToken, Lexer, createToken } from "chevrotain";

export type LogHandler = (entry: string) => void;

export interface CreateTreeCommand {
    type: "createTree";
    name: string;
    propsText: string;
}

export interface CreateCategoryCommand {
    type: "createCategory";
    name: string;
    parent: string;
    propsText?: string;
}

export interface CreateLayerCommand {
    type: "createLayer";
    name: string;
    propsText?: string;
}

export interface CreateNodeCommand {
    type: "createNode";
    name: string;
    parent: string;
    category: string;
    propsText?: string;
}

export interface CreateConnectionCommand {
    type: "createConnection";
    name: string;
    from: string;
    to: string;
    layer: string;
    propsText?: string;
}

export interface DisconnectCommand {
    type: "disconnect";
    name: string;
}

export interface RepeatCommand {
    type: "repeat";
    count: number;
    command: DslCommand;
    parameters: string[];
}

export type DslCommand =
    | CreateTreeCommand
    | CreateCategoryCommand
    | CreateLayerCommand
    | CreateNodeCommand
    | CreateConnectionCommand
    | DisconnectCommand
    | RepeatCommand;

export interface ExecutorResult {
    [key: string]: unknown;
}

export interface CommandExecutors {
    createTree(name: string, props: unknown): ExecutorResult;
    createCategory(name: string, parent: string, props: unknown): ExecutorResult;
    createLayer(name: string, props: unknown): ExecutorResult;
    createNode(name: string, parent: string, category: string, props: unknown): ExecutorResult;
    createConnection(name: string, from: string, to: string, layer: string, props: unknown): ExecutorResult;
    deleteConnection(name: string): ExecutorResult;
}

interface ExecutionContext {
    repeatStack: number[];
    parameterStack: string[][];
}

type TokenDefinition = ReturnType<typeof createToken>;

interface TokenSet {
    WhiteSpace: TokenDefinition;
    Semicolon: TokenDefinition;
    Create: TokenDefinition;
    Repeat: TokenDefinition;
    Tree: TokenDefinition;
    Category: TokenDefinition;
    Node: TokenDefinition;
    Layer: TokenDefinition;
    Connect: TokenDefinition;
    Disconnect: TokenDefinition;
    Parent: TokenDefinition;
    Props: TokenDefinition;
    LSquare: TokenDefinition;
    RSquare: TokenDefinition;
    Comma: TokenDefinition;
    Integer: TokenDefinition;
    StringLiteral: TokenDefinition;
    all: TokenDefinition[];
}

class TreeDslParser extends CstParser {
    public constructor(private readonly tokens: TokenSet) {
        super(tokens.all);
        this.performSelfAnalysis();
    }

    public readonly script = this.RULE("script", () => {
        this.AT_LEAST_ONE(() => {
            this.SUBRULE(this.statement);
        });
    });

    private readonly statement = this.RULE("statement", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.command, { LABEL: "command" }) },
            { ALT: () => this.SUBRULE(this.repeatStatement, { LABEL: "repeat" }) },
        ]);
        this.CONSUME(this.tokens.Semicolon);
    });

    private readonly command = this.RULE("command", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.createTreeStatement, { LABEL: "tree" }) },
            { ALT: () => this.SUBRULE(this.createCategoryStatement, { LABEL: "category" }) },
            { ALT: () => this.SUBRULE(this.createLayerStatement, { LABEL: "layer" }) },
            { ALT: () => this.SUBRULE(this.createNodeStatement, { LABEL: "node" }) },
            { ALT: () => this.SUBRULE(this.createConnectionStatement, { LABEL: "connection" }) },
            { ALT: () => this.SUBRULE(this.disconnectStatement, { LABEL: "disconnect" }) },
        ]);
    });

    private readonly repeatStatement = this.RULE("repeatStatement", () => {
        this.CONSUME(this.tokens.Repeat);
        this.CONSUME(this.tokens.Integer, { LABEL: "count" });
        this.OPTION(() => {
            this.CONSUME(this.tokens.LSquare);
            this.OPTION1(() => {
                this.CONSUME(this.tokens.StringLiteral, { LABEL: "args" });
                this.MANY(() => {
                    this.CONSUME(this.tokens.Comma);
                    this.CONSUME2(this.tokens.StringLiteral, { LABEL: "args" });
                });
            });
            this.CONSUME(this.tokens.RSquare);
        });
        this.SUBRULE(this.command, { LABEL: "command" });
    });

    private readonly createTreeStatement = this.RULE("createTreeStatement", () => {
        this.CONSUME(this.tokens.Create);
        this.CONSUME(this.tokens.Tree);
        this.CONSUME(this.tokens.StringLiteral, { LABEL: "name" });
        this.CONSUME(this.tokens.Props);
        this.CONSUME2(this.tokens.StringLiteral, { LABEL: "props" });
    });

    private readonly createCategoryStatement = this.RULE("createCategoryStatement", () => {
        this.CONSUME(this.tokens.Create);
        this.CONSUME(this.tokens.Category);
        this.CONSUME(this.tokens.StringLiteral, { LABEL: "name" });
        this.CONSUME(this.tokens.Parent);
        this.CONSUME2(this.tokens.StringLiteral, { LABEL: "parent" });
        this.OPTION(() => {
            this.CONSUME(this.tokens.Props);
            this.CONSUME3(this.tokens.StringLiteral, { LABEL: "props" });
        });
    });

    private readonly createLayerStatement = this.RULE("createLayerStatement", () => {
        this.CONSUME(this.tokens.Create);
        this.CONSUME(this.tokens.Layer);
        this.CONSUME(this.tokens.StringLiteral, { LABEL: "name" });
        this.OPTION(() => {
            this.CONSUME(this.tokens.Props);
            this.CONSUME2(this.tokens.StringLiteral, { LABEL: "props" });
        });
    });

    private readonly createNodeStatement = this.RULE("createNodeStatement", () => {
        this.CONSUME(this.tokens.Create);
        this.CONSUME(this.tokens.Node);
        this.CONSUME(this.tokens.StringLiteral, { LABEL: "name" });
        this.CONSUME(this.tokens.Parent);
        this.CONSUME2(this.tokens.StringLiteral, { LABEL: "parent" });
        this.CONSUME(this.tokens.Category, { LABEL: "categoryKeyword" });
        this.CONSUME3(this.tokens.StringLiteral, { LABEL: "category" });
        this.OPTION(() => {
            this.CONSUME(this.tokens.Props);
            this.CONSUME4(this.tokens.StringLiteral, { LABEL: "props" });
        });
    });

    private readonly createConnectionStatement = this.RULE("createConnectionStatement", () => {
        this.CONSUME(this.tokens.Connect);
        this.CONSUME(this.tokens.StringLiteral, { LABEL: "name" });
        this.CONSUME2(this.tokens.StringLiteral, { LABEL: "from" });
        this.CONSUME3(this.tokens.StringLiteral, { LABEL: "to" });
        this.CONSUME(this.tokens.Layer);
        this.CONSUME4(this.tokens.StringLiteral, { LABEL: "layer" });
        this.OPTION(() => {
            this.CONSUME(this.tokens.Props);
            this.CONSUME5(this.tokens.StringLiteral, { LABEL: "props" });
        });
    });

    private readonly disconnectStatement = this.RULE("disconnectStatement", () => {
        this.CONSUME(this.tokens.Disconnect);
        this.CONSUME(this.tokens.StringLiteral, { LABEL: "name" });
    });
}

type TreeVisitorInstance = InstanceType<ReturnType<TreeDslParser["getBaseCstVisitorConstructor"]>>;

export class CommandInterpreter {
    private static instance: CommandInterpreter | undefined;
    private static readonly tokens: TokenSet = CommandInterpreter.createTokens();
    private static readonly defaultLogHandler: LogHandler = (entry) => {
        console.log(entry);
    };

    public static initialize(executors: CommandExecutors): CommandInterpreter {
        if (!CommandInterpreter.instance) {
            CommandInterpreter.instance = new CommandInterpreter(executors);
        } else {
            CommandInterpreter.instance.updateExecutors(executors);
        }

        return CommandInterpreter.instance;
    }

    public static getInstance(): CommandInterpreter {
        if (!CommandInterpreter.instance) {
            throw new Error("CommandInterpreter has not been initialized. Call CommandInterpreter.initialize() first.");
        }

        return CommandInterpreter.instance;
    }

    private static createTokens(): TokenSet {
        const WhiteSpace = createToken({
            name: "WhiteSpace",
            pattern: /\s+/,
            group: Lexer.SKIPPED,
        });
        const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
        const Create = createToken({ name: "Create", pattern: /create/ });
        const Repeat = createToken({ name: "Repeat", pattern: /repeat/ });
        const Tree = createToken({ name: "Tree", pattern: /tree/ });
        const Category = createToken({ name: "Category", pattern: /category/ });
        const Node = createToken({ name: "Node", pattern: /node/ });
        const Layer = createToken({ name: "Layer", pattern: /layer/ });
        const Connect = createToken({ name: "Connect", pattern: /connect/ });
        const Disconnect = createToken({ name: "Disconnect", pattern: /disconnect/ });
        const Parent = createToken({ name: "Parent", pattern: /parent/ });
        const Props = createToken({ name: "Props", pattern: /props/ });
        const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
        const RSquare = createToken({ name: "RSquare", pattern: /]/ });
        const Comma = createToken({ name: "Comma", pattern: /,/ });
        const Integer = createToken({ name: "Integer", pattern: /0|[1-9]\d*/ });
        const StringLiteral = createToken({
            name: "StringLiteral",
            pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
        });

        return {
            WhiteSpace,
            Semicolon,
            Create,
            Repeat,
            Tree,
            Category,
            Node,
            Layer,
            Connect,
            Disconnect,
            Parent,
            Props,
            LSquare,
            RSquare,
            Comma,
            Integer,
            StringLiteral,
            all: [
                WhiteSpace,
                Semicolon,
                Create,
                Repeat,
                Tree,
                Category,
                Node,
                Layer,
                Connect,
                Disconnect,
                Parent,
                Props,
                LSquare,
                RSquare,
                Comma,
                Integer,
                StringLiteral,
            ],
        };
    }

    private readonly lexer: Lexer;
    private readonly parser: TreeDslParser;
    private readonly visitor: TreeVisitorInstance;

    private logger: LogHandler = CommandInterpreter.defaultLogHandler;
    private executors: CommandExecutors;

    private constructor(executors: CommandExecutors) {
        this.executors = executors;
        this.lexer = new Lexer(CommandInterpreter.tokens.all);
        this.parser = new TreeDslParser(CommandInterpreter.tokens);
        this.visitor = this.createVisitor();
    }

    public updateExecutors(executors: CommandExecutors): void {
        this.executors = executors;
    }

    public parse(source: string): DslCommand[] {
        const lexingResult = this.lexer.tokenize(source);

        if (lexingResult.errors.length > 0) {
            const messages = lexingResult.errors.map((err) => err.message).join("\n");
            throw new Error(`Lexical error: ${messages}`);
        }

        this.parser.input = lexingResult.tokens;
        const cst = this.parser.script();

        if (this.parser.errors.length > 0) {
            const messages = this.parser.errors.map((err) => err.message).join("\n");
            this.parser.reset();
            throw new Error(`Syntax error: ${messages}`);
        }

        const commands = this.visitor.visit(cst) as DslCommand[];
        this.parser.reset();
        return commands;
    }

    public async executeScripts(
        source: string,
        logHandler: LogHandler = CommandInterpreter.defaultLogHandler
    ): Promise<ExecutorResult[]> {
        const previousLogger = this.logger;
        this.logger = logHandler;

        try {
            this.log(`Script execution started. ${new Date().toISOString()}`);
            const commands = this.parse(source);
            const context: ExecutionContext = { repeatStack: [], parameterStack: [] };
            const results: ExecutorResult[] = [];

            for (const command of commands) {
                this.log(`Executing ${CommandInterpreter.describeCommand(command)}`);
                const commandResults = this.executeCommand(command, context);
                results.push(...commandResults);
            }

            this.log("Script execution completed.");
            return results;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(`Execution error: ${message}`);
            throw error;
        } finally {
            this.logger = previousLogger;
        }
    }

    public executeScript(source: string): void {
        void this.executeScripts(source);
    }

    private createVisitor(): TreeVisitorInstance {
        const BaseVisitor = this.parser.getBaseCstVisitorConstructor();
        const interpreter = this;

        class Visitor extends BaseVisitor {
            public script(ctx: { statement?: CstNode[] }): DslCommand[] {
                const statements = ctx.statement ?? [];
                return statements.map((node) => this.visit(node) as DslCommand);
            }

            public statement(ctx: { command?: CstNode[]; repeat?: CstNode[] }): DslCommand {
                const commandNode = ctx.command?.[0];
                if (commandNode) {
                    return this.visit(commandNode) as DslCommand;
                }

                const repeatNode = ctx.repeat?.[0];
                if (repeatNode) {
                    return this.visit(repeatNode) as RepeatCommand;
                }

                throw new Error("Invalid or unknown command.");
            }

            public command(ctx: {
                tree?: CstNode[];
                category?: CstNode[];
                layer?: CstNode[];
                node?: CstNode[];
                connection?: CstNode[];
                disconnect?: CstNode[];
            }): DslCommand {
                const treeNode = ctx.tree?.[0];
                if (treeNode) {
                    return this.visit(treeNode) as CreateTreeCommand;
                }

                const categoryNode = ctx.category?.[0];
                if (categoryNode) {
                    return this.visit(categoryNode) as CreateCategoryCommand;
                }

                const layerNode = ctx.layer?.[0];
                if (layerNode) {
                    return this.visit(layerNode) as CreateLayerCommand;
                }

                const nodeNode = ctx.node?.[0];
                if (nodeNode) {
                    return this.visit(nodeNode) as CreateNodeCommand;
                }

                const connectionNode = ctx.connection?.[0];
                if (connectionNode) {
                    return this.visit(connectionNode) as CreateConnectionCommand;
                }

                const disconnectNode = ctx.disconnect?.[0];
                if (disconnectNode) {
                    return this.visit(disconnectNode) as DisconnectCommand;
                }

                throw new Error("Invalid or unknown command.");
            }

            public repeatStatement(ctx: {
                count?: IToken[];
                command?: CstNode[];
                args?: IToken[];
            }): RepeatCommand {
                const countToken = ctx.count?.[0];
                const commandNode = ctx.command?.[0];

                if (!countToken || !commandNode) {
                    throw new Error("Missing repeat parameter.");
                }

                const count = Number(countToken.image);

                if (!Number.isInteger(count) || count < 1) {
                    throw new Error("The repeat count must be a positive integer.");
                }

                const innerCommand = this.visit(commandNode) as DslCommand;

                const argsTokens = ctx.args ?? [];
                const parameters = argsTokens.map((token) => interpreter.parseStringLiteral(token, "repeat parameter"));

                return {
                    type: "repeat",
                    count,
                    command: innerCommand,
                    parameters,
                };
            }

            public createTreeStatement(ctx: { name?: IToken[]; props?: IToken[] }): CreateTreeCommand {
                const nameToken = ctx.name?.[0];
                const propsToken = ctx.props?.[0];

                if (!nameToken || !propsToken) {
                    throw new Error("Missing create tree parameter.");
                }

                const name = interpreter.parseStringLiteral(nameToken, "tree name");
                const propsText = interpreter.parseStringLiteral(propsToken, "props");

                return {
                    type: "createTree",
                    name,
                    propsText,
                };
            }

            public createCategoryStatement(ctx: {
                name?: IToken[];
                parent?: IToken[];
                props?: IToken[];
            }): CreateCategoryCommand {
                const nameToken = ctx.name?.[0];
                const parentToken = ctx.parent?.[0];
                const propsToken = ctx.props?.[0];

                if (!nameToken || !parentToken) {
                    throw new Error("Missing create category parameter.");
                }

                const name = interpreter.parseStringLiteral(nameToken, "category name");
                const parent = interpreter.parseStringLiteral(parentToken, "parent category name");

                let propsText: string | undefined;

                if (propsToken) {
                    propsText = interpreter.parseStringLiteral(propsToken, "category props");
                }

                return {
                    type: "createCategory",
                    name,
                    parent,
                    propsText,
                };
            }

            public createLayerStatement(ctx: { name?: IToken[]; props?: IToken[] }): CreateLayerCommand {
                const nameToken = ctx.name?.[0];
                const propsToken = ctx.props?.[0];

                if (!nameToken) {
                    throw new Error("Missing layer name.");
                }

                const name = interpreter.parseStringLiteral(nameToken, "layer name");

                let propsText: string | undefined;

                if (propsToken) {
                    propsText = interpreter.parseStringLiteral(propsToken, "layer props");
                }

                return {
                    type: "createLayer",
                    name,
                    propsText,
                };
            }

            public createNodeStatement(ctx: {
                name?: IToken[];
                parent?: IToken[];
                category?: IToken[];
                props?: IToken[];
            }): CreateNodeCommand {
                const nameToken = ctx.name?.[0];
                const parentToken = ctx.parent?.[0];
                const categoryToken = ctx.category?.[0];
                const propsToken = ctx.props?.[0];

                if (!nameToken || !parentToken || !categoryToken) {
                    throw new Error("Missing create node parameter.");
                }

                const name = interpreter.parseStringLiteral(nameToken, "node name");
                const parent = interpreter.parseStringLiteral(parentToken, "parent node name");
                const category = interpreter.parseStringLiteral(categoryToken, "category name");

                let propsText: string | undefined;

                if (propsToken) {
                    propsText = interpreter.parseStringLiteral(propsToken, "node props");
                }

                return {
                    type: "createNode",
                    name,
                    parent,
                    category,
                    propsText,
                };
            }

            public createConnectionStatement(ctx: {
                name?: IToken[];
                from?: IToken[];
                to?: IToken[];
                layer?: IToken[];
                props?: IToken[];
            }): CreateConnectionCommand {
                const nameToken = ctx.name?.[0];
                const fromToken = ctx.from?.[0];
                const toToken = ctx.to?.[0];
                const layerToken = ctx.layer?.[0];
                const propsToken = ctx.props?.[0];

                if (!nameToken || !fromToken || !toToken || !layerToken) {
                    throw new Error("Missing connect parameter.");
                }

                const name = interpreter.parseStringLiteral(nameToken, "connection name");
                const from = interpreter.parseStringLiteral(fromToken, "source node name");
                const to = interpreter.parseStringLiteral(toToken, "target node name");
                const layer = interpreter.parseStringLiteral(layerToken, "layer name");

                let propsText: string | undefined;

                if (propsToken) {
                    propsText = interpreter.parseStringLiteral(propsToken, "connection props");
                }

                return {
                    type: "createConnection",
                    name,
                    from,
                    to,
                    layer,
                    propsText,
                };
            }

            public disconnectStatement(ctx: { name?: IToken[] }): DisconnectCommand {
                const nameToken = ctx.name?.[0];

                if (!nameToken) {
                    throw new Error("Missing disconnect parameter.");
                }

                const name = interpreter.parseStringLiteral(nameToken, "connection name");

                return {
                    type: "disconnect",
                    name,
                };
            }
        }

        return new Visitor();
    }

    private executeCommand(command: DslCommand, context: ExecutionContext): ExecutorResult[] {
        switch (command.type) {
            case "createTree": {
                const name = this.substitutePlaceholders(command.name, context);
                const props = this.parsePropsText(command.propsText, context, "the tree props field");
                this.log(`createTree invoked: ${name}`);
                this.log(props);
                const result = this.executors.createTree(name, props);
                return [result];
            }
            case "createCategory": {
                const name = this.substitutePlaceholders(command.name, context);
                const parent = this.substitutePlaceholders(command.parent, context);
                const props = this.parsePropsText(command.propsText, context, "the category props field");
                this.log(`createCategory invoked: ${name} (parent: ${parent})`);
                this.log(props);
                const result = this.executors.createCategory(name, parent, props);
                return [result];
            }
            case "createLayer": {
                const name = this.substitutePlaceholders(command.name, context);
                const props = this.parsePropsText(command.propsText, context, "the layer props field");
                this.log(`createLayer invoked: ${name}`);
                this.log(props);
                const result = this.executors.createLayer(name, props);
                return [result];
            }
            case "createNode": {
                const name = this.substitutePlaceholders(command.name, context);
                const parent = this.substitutePlaceholders(command.parent, context);
                const category = this.substitutePlaceholders(command.category, context);
                const props = this.parsePropsText(command.propsText, context, "the node props field");
                this.log(`createNode invoked: ${name} (parent: ${parent}, category: ${category})`);
                this.log(props);
                const result = this.executors.createNode(name, parent, category, props);
                return [result];
            }
            case "createConnection": {
                const name = this.substitutePlaceholders(command.name, context);
                const from = this.substitutePlaceholders(command.from, context);
                const to = this.substitutePlaceholders(command.to, context);
                const layer = this.substitutePlaceholders(command.layer, context);
                const props = this.parsePropsText(command.propsText, context, "the connection props field");
                this.log(`createConnection invoked: ${name} (${from} -> ${to}, layer: ${layer})`);
                this.log(props);
                const result = this.executors.createConnection(name, from, to, layer, props);
                return [result];
            }
            case "disconnect": {
                const name = this.substitutePlaceholders(command.name, context);
                this.log(`deleteConnection invoked: ${name}`);
                const result = this.executors.deleteConnection(name);
                return [result];
            }
            case "repeat": {
                context.parameterStack.push(command.parameters);
                const results: ExecutorResult[] = [];
                try {
                    for (let iteration = 0; iteration < command.count; iteration += 1) {
                        context.repeatStack.push(iteration);
                        try {
                            const innerResults = this.executeCommand(command.command, context);
                            results.push(...innerResults);
                        } finally {
                            context.repeatStack.pop();
                        }
                    }
                } finally {
                    context.parameterStack.pop();
                }
                return results;
            }
            default: {
                const unexpected = command as { type: string };
                throw new Error(`Unknown command type: ${unexpected.type}`);
            }
        }
    }

    private parsePropsText(text: string | undefined, context: ExecutionContext, label: string): unknown {
        const source = text ?? "{}";
        const resolved = this.substitutePlaceholders(source, context);

        try {
            return JSON.parse(resolved);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Invalid JSON in ${label}: ${message}`);
        }
    }

    private substitutePlaceholders(value: string, context: ExecutionContext): string {
        if (!value.includes("$")) {
            return value;
        }

        let result = value;

        if (result.includes("$$")) {
            const repeatIndex = CommandInterpreter.currentRepeatIndex(context);
            if (repeatIndex === undefined) {
                throw new Error("The $$ placeholder can only be used inside a repeat block.");
            }
            result = result.split("$$").join(String(repeatIndex));
        }

        return result.replace(/\$(\d+)/g, (match, group) => {
            const index = Number(group);

            if (!Number.isFinite(index)) {
                return match;
            }

            if (index === 0) {
                const repeatIndex = CommandInterpreter.currentRepeatIndex(context);
                if (repeatIndex === undefined) {
                    throw new Error("The $0 placeholder can only be used inside a repeat block.");
                }
                return String(repeatIndex);
            }

            const parameters = CommandInterpreter.currentParameters(context);
            if (!parameters || index - 1 >= parameters.length) {
                throw new Error(`Invalid repeat parameter index: $${index}`);
            }

            return parameters[index - 1];
        });
    }

    private parseStringLiteral(token: IToken, label: string): string {
        const raw = token.image;

        if (raw.length < 2) {
            throw new Error(`The ${label} value is an empty string.`);
        }

        const quote = raw[0];

        if (quote !== '"' && quote !== "'") {
            throw new Error(`The ${label} must be wrapped in quotes.`);
        }

        try {
            if (quote === '"') {
                return JSON.parse(raw);
            }

            const inner = raw.slice(1, -1).replace(/\\'/g, "'");
            const normalized = `"${inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

            return JSON.parse(normalized);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Invalid string literal in the ${label} parameter: ${message}`);
        }
    }

    private log(...entries: unknown[]): void {
        if (entries.length === 0) {
            return;
        }

        for (const entry of entries) {
            this.logger(CommandInterpreter.formatValue(entry));
        }
    }

    private static describeCommand(command: DslCommand): string {
        switch (command.type) {
            case "createTree":
                return `createTree "${command.name}"`;
            case "createCategory":
                return `createCategory "${command.name}" parent "${command.parent}"`;
            case "createLayer":
                return `createLayer "${command.name}"`;
            case "createNode":
                return `createNode "${command.name}" parent "${command.parent}" category "${command.category}"`;
            case "createConnection":
                return `connect "${command.name}" ${command.from} -> ${command.to} layer "${command.layer}"`;
            case "disconnect":
                return `disconnect "${command.name}"`;
            case "repeat":
                return `repeat ${command.count} times`;
            default:
                return `Unknown command ${(command as { type: string }).type}`;
        }
    }

    private static currentRepeatIndex(context: ExecutionContext): number | undefined {
        const stackLength = context.repeatStack.length;
        if (stackLength === 0) {
            return undefined;
        }

        return context.repeatStack[stackLength - 1];
    }

    private static currentParameters(context: ExecutionContext): string[] | undefined {
        const stackLength = context.parameterStack.length;
        if (stackLength === 0) {
            return undefined;
        }

        return context.parameterStack[stackLength - 1];
    }

    private static formatValue(value: unknown): string {
        if (typeof value === "string") {
            return value;
        }

        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
}

export function parseScript(source: string): DslCommand[] {
    return CommandInterpreter.getInstance().parse(source);
}

export async function executeScripts(source: string, logHandler?: LogHandler): Promise<ExecutorResult[]> {
    return CommandInterpreter.getInstance().executeScripts(source, logHandler);
}

export function executeScript(source: string): void {
    CommandInterpreter.getInstance().executeScript(source);
}
