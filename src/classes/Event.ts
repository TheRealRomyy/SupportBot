import { clientInterface } from "../interfaces";

class Event {

    public readonly client: clientInterface;

	constructor(client : clientInterface) {
		this.client = client;
	}
}

export { Event, clientInterface as Client };