import type { ActiveOutline } from "./types";

interface Store {
	activeOutlines: Array<ActiveOutline>;
}

export const STORE: Store = {
	activeOutlines: [],
};
