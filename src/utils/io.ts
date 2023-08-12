import inquirer, { Answers } from 'inquirer';
import { InstallerModules } from '../config';

export class IO {
    public static customizeInstall = async (
        mods: InstallerModules,
    ): Promise<void> => {
        for (const prop in mods) {
            do {
                if (mods[prop] !== undefined) {
                    const answers: Answers = await inquirer.prompt([
                        {
                            name: prop,
                            message: mods[prop]!.prompt,
                            type: mods[prop]!.promptType ?? 'input',
                            default: mods[prop]!.promptDefault,
                        },
                    ]);

                    if (
                        answers &&
                        answers[prop] !== undefined &&
                        (await mods[prop]!.validation.isValid(answers[prop]))
                    ) {
                        mods[prop]!.value = answers[prop];
                    } else {
                        console.log(typeof answers[prop], answers[prop]);
                        process.stdout.write(
                            mods[prop]!.validationErrorMsg + '\n',
                        );
                    }

                    if (mods[prop]!.dependencies && mods[prop]!.value) {
                        await this.customizeInstall(
                            mods[prop]!.dependencies as InstallerModules,
                        );
                    }
                }
            } while (mods[prop]!.value === undefined);
        }
    };
}
