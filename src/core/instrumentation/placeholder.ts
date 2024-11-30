// __REACT_DEVTOOLS_GLOBAL_HOOK__ must exist before React is ever executed
// this is the case with the React Devtools extension, but without it, we need

let attemptCount = 0;
const MAX_ATTEMPTS = 3;

// temporary hack since module is sometime uninitialized in expo
//  fix is probably to remove circular imports
function ensureDevtoolsHook() {
  return new Promise((resolve) => {
    function attempt() {
      try {
        const { registerDevtoolsHook } = require('./fiber');
        if (registerDevtoolsHook) {
          registerDevtoolsHook({
            onCommitFiberRoot() {
              /**/
            },
          });
          resolve(true);
        } else if (attemptCount < MAX_ATTEMPTS) {
          attemptCount++;
          setTimeout(attempt, 50);
        } else {
          resolve(false);
        }
      } catch (e) {
        if (attemptCount < MAX_ATTEMPTS) {
          attemptCount++;
          setTimeout(attempt, 50);
        } else {
          resolve(false);
        }
      }
    }
    attempt();
  });
}

if (typeof globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
  ensureDevtoolsHook();
}


export {}