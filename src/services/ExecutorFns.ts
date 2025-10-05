import { CommandExecutors } from './CommandInterpreter';

const logInvoke = (message: string, payload?: unknown): void => {
    console.log(message);
    if (payload !== undefined) {
        try {
            console.log(JSON.stringify(payload, null, 2));
        } catch {
            console.log(String(payload));
        }
    }
};

const toSerializable = (payload: unknown): unknown => {
    try {
        return JSON.parse(JSON.stringify(payload));
    } catch {
        return payload;
    }
};

export function createServerExecutors(): CommandExecutors {
    return {
        createTree: (name, props) => {
            logInvoke(`Server executor createTree invoked: ${name}`, props);
            return {
                action: "createTree",
                name,
                props: toSerializable(props),
            };
        },
        createCategory: (name, parent, props) => {
            logInvoke(`Server executor createCategory invoked: ${name} (parent: ${parent})`, props);
            return {
                action: "createCategory",
                name,
                parent,
                props: toSerializable(props),
            };
        },
        createLayer: (name, props) => {
            logInvoke(`Server executor createLayer invoked: ${name}`, props);
            return {
                action: "createLayer",
                name,
                props: toSerializable(props),
            };
        },
        createNode: (name, parent, category, props) => {
            logInvoke(`Server executor createNode invoked: ${name} (parent: ${parent}, category: ${category})`, props);
            return {
                action: "createNode",
                name,
                parent,
                category,
                props: toSerializable(props),
            };
        },
        createConnection: (name, from, to, layer, props) => {
            logInvoke(`Server executor createConnection invoked: ${name} (${from} -> ${to}, layer: ${layer})`, props);
            return {
                action: "createConnection",
                name,
                from,
                to,
                layer,
                props: toSerializable(props),
            };
        },
        deleteConnection: (name) => {
            logInvoke(`Server executor deleteConnection invoked: ${name}`);
            return {
                action: "deleteConnection",
                name,
            };
        },
    };
}
