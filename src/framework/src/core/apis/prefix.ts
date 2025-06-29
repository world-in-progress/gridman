export default function getPrefix(isRemote: boolean): string {
    return isRemote ? '/remote' : '/local'
}