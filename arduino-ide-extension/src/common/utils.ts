export const naturalCompare: (left: string, right: string) => number = require('string-natural-compare').caseInsensitive;

export function notEmpty(arg: string | undefined | null): arg is string {
    return !!arg;
}
