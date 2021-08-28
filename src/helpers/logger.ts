import * as console from "console";
import { blue, red, yellow} from "chalk";

export class Logger {

    public log(message) : void {
        console.log(`[${new Date().toLocaleDateString()}] [${new Date().toLocaleTimeString()}] [${blue("INFO")}] ${message}`);
    }

    public error(message) : void {
        console.log(`[${new Date().toLocaleDateString()}] [${new Date().toLocaleTimeString()}] [${red("ERROR")}] ${message}`);
    }

    public warn(message) : void {
        console.log(`[${new Date().toLocaleDateString()}] [${new Date().toLocaleTimeString()}] [${yellow("WARN")}] ${message}`);
    }
}