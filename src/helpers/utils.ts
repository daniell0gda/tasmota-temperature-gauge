import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import pick from 'lodash/pick';
import some from 'lodash/some';
import toLower from 'lodash/toLower';
import values from 'lodash/values';


export function urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function isNumeric(value: any): boolean {
    return /^\d+(\.\d+)?$/.test(value);
}

/**
 * Composes object with properties only with desired properties names
 * @param obj object to filter
 * @param filterProperties properties to take
 */
function filterObjectsProperties<T>(obj: T, filterProperties: Array<keyof T>): Partial<T> {
    if (filterProperties.length === 0) {
        return obj;
    }
    return pick(obj, filterProperties);
}

/**
 *
 * @param val this value will be searched in collection
 * @param collection collection where value will be searched
 * @param filterOnlyProperties if provided then only matched collection's properties names will be checked
 */
export function filterByAnyFieldInCollection<T>(val: string | number, collection: T[], filterOnlyProperties: Array<keyof T> = []): T[] {
    if ((val as string).endsWith('.')) {
        let testIfFloat: string = (val as string).slice(0, (val as string).length - 1);
        if (isNumeric(testIfFloat)) {
            val = parseFloat(testIfFloat);
        }
    } else if (isNumeric(val)) {
        val = parseFloat(val as string);
    }
    // if the value is an empty string don't filter the items
    if (val) {
        if (isString(val) && (val as string).trim() !== '') {
            let searchedVal = toLower(val);
            collection = collection.filter((item: T) => {
                let filteredObject = filterObjectsProperties(item, filterOnlyProperties);
                return some(values(filteredObject), (prop: unknown) => {
                    if (isString(prop)) {
                        return toLower(prop).indexOf(searchedVal) > -1;
                    } else {
                        return false;
                    }
                });
            });
        } else if (isNumber(val)) {
            let searchedVal = val.toString();
            collection = collection.filter((item: T) => {
                let filteredObject = filterObjectsProperties(item, filterOnlyProperties);
                return some(values(filteredObject), (prop: unknown) => {
                    if (isNumber(prop)) {
                        return toLower(prop.toString()).indexOf(searchedVal) > -1;
                    } else {
                        return false;
                    }
                });
            });
        }
    }
    return collection;
}

export function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function addDays(dateToAdd: Date, days: number): Date {
    let date = new Date(dateToAdd.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
