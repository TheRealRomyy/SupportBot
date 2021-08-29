import { Snowflake } from "discord.js";
import { clientInterface } from "../interfaces";
import { sep } from "path";
import { exec } from "child_process";

export async function chatExport(channelId : Snowflake, userId : Snowflake, client : clientInterface) : Promise<string> {

    const back3folders = __dirname.split(`${sep}`).slice(0, -3).join(`/`);

    return new Promise((resolve, reject) => {

        const secondPartOfCommand = `dotnet DiscordChatExporter.Cli.dll export -c ${channelId} -t "${client.token}" -b True -o "${back3folders}/transcription/${userId}-${channelId}.html"`;

        exec(`cd ${back3folders}/Chat && ${secondPartOfCommand}`, async (error, data) => {

            if (data.indexOf('Done.') !== -1) resolve(`${back3folders}/transcription/${userId}-${channelId}.html`);
            else reject(error);

        });
    });
}
