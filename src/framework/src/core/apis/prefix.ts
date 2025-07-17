export default function getPrefix(isRemote: boolean): string {
    return isRemote ? '/remote' : '/local'
}

export function getResourcePrefix(isResource: boolean): string {
    return isResource ? '/resource' : '/model'
}