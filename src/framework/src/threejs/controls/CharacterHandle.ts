import { bindAll } from '../utils/Util';
import { Character } from './Character';

export class CharacterHandle {
    character: Character;

    constructor(character: Character) {
        this.character = character;

        bindAll(['keydown', 'keyup'], this);
    }

    keydown(e) {
        const character = this.character;

        const keyCode = e.key.toLowerCase();

        switch (keyCode) {
            case 'shift':
                character.toggleRun = true;
                break;

            case '=':
            case '+':
                character.scaleVeclocity *= 1.05;
                if (character.scaleVeclocity > 100) character.scaleVeclocity = 100;
                break;
            case '-':
            case '_':
                character.scaleVeclocity *= 0.95;
                if (character.scaleVeclocity < 0.01) character.scaleVeclocity = 0.01;
                break;

            case 'v':
                character.toggleVisible();
                break;

            case 'w':
                character.moveForward = true;
                break;
            case 's':
                character.moveBackward = true;
                break;
            case 'a':
                character.moveLeft = true;
                break;
            case 'd':
                character.moveRight = true;
                break;
            case 'q':
                character.moveUp = true;
                break;
            case 'e':
                character.moveDown = true;
                break;

            default:
                break;
        }
    }

    keyup(e) {
        const character = this.character;
        const keyCode = e.key.toLowerCase();

        switch (keyCode) {
            case 'shift':
                character.toggleRun = false;
                break;

            case 'w':
                character.moveForward = false;
                break;
            case 's':
                character.moveBackward = false;
                break;
            case 'a':
                character.moveLeft = false;
                break;
            case 'd':
                character.moveRight = false;
                break;
            case 'q':
                character.moveUp = false;
                break;
            case 'e':
                character.moveDown = false;
                break;

            default:
                break;
        }
    }

    enable() {
        window.addEventListener('keyup', this.keyup);
        window.addEventListener('keydown', this.keydown);
    }

    disable() {
        window.removeEventListener('keyup', this.keyup);
        window.removeEventListener('keydown', this.keydown);
    }

    public update(delta: number) {}
}
