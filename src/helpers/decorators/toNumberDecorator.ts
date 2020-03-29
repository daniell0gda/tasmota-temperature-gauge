import _ from 'lodash';


export function ToNumber(): (target: Object, key: string) => void {
    return (target: Object, key: string) => {

        let definition = Object.getOwnPropertyDescriptor(target, key);
        if (definition) {
            Object.defineProperty(target, key, {
                get: definition.get,
                set: (newValue: string) => {
                    definition.set(_.parseInt(newValue));
                },
                enumerable: true,
                configurable: true
            });
        } else {
            Object.defineProperty(target, key, {
                get: () => {
                    return this['__' + key];
                },
                set: (newValue: string) => {
                    this['__' + key] = _.parseInt(newValue);
                },
                enumerable: true,
                configurable: true
            });
        }
    };
}
