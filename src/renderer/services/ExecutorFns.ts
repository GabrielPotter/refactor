import { CommandExecutors, LogHandler } from '../../services/CommandInterpreter';

export interface ExecutorLogContext {
  log: LogHandler;
}

const createPassthrough =
  (context: ExecutorLogContext, message: string, value?: unknown) =>
  () => {
    context.log(message);
    if (value !== undefined) {
      context.log(JSON.stringify(value, null, 2));
    }
  };

const toSerializable = (value: unknown) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

export function createExecutors(log: LogHandler): CommandExecutors {
  const context: ExecutorLogContext = { log };

  return {
    createTree: (name: string, props: unknown) => {
      createPassthrough(context, `Executor createTree invoked: ${name}`, props)();
      return {
        action: 'createTree',
        name,
        props: toSerializable(props)
      };
    },
    createCategory: (name: string, parent: string, props: unknown) => {
      context.log(`Executor createCategory invoked: ${name} (parent: ${parent})`);
      context.log(JSON.stringify(props, null, 2));
      return {
        action: 'createCategory',
        name,
        parent,
        props: toSerializable(props)
      };
    },
    createLayer: (name: string, props: unknown) => {
      createPassthrough(context, `Executor createLayer invoked: ${name}`, props)();
      return {
        action: 'createLayer',
        name,
        props: toSerializable(props)
      };
    },
    createNode: (name: string, parent: string, category: string, props: unknown) => {
      context.log(`Executor createNode invoked: ${name} (parent: ${parent}, category: ${category})`);
      context.log(JSON.stringify(props, null, 2));
      return {
        action: 'createNode',
        name,
        parent,
        category,
        props: toSerializable(props)
      };
    },
    createConnection: (name: string, from: string, to: string, layer: string, props: unknown) => {
      context.log(`Executor createConnection invoked: ${name} (${from} -> ${to}, layer: ${layer})`);
      context.log(JSON.stringify(props, null, 2));
      return {
        action: 'createConnection',
        name,
        from,
        to,
        layer,
        props: toSerializable(props)
      };
    },
    deleteConnection: (name: string) => {
      createPassthrough(context, `Executor deleteConnection invoked: ${name}`)();
      return {
        action: 'deleteConnection',
        name
      };
    }
  };
}
