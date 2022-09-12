import * as jsyaml from 'js-yaml';
import { BaseEvalElement, createWidget } from './base';
import { appConfig, addInitializer, addPostInitializer } from '../stores';
import type { AppConfig, Runtime } from '../runtime';
import { handleFetchError, getTextFromUrl } from '../utils';
import { PyodideRuntime, DEFAULT_RUNTIME_CONFIG } from '../pyodide';
import { getLogger } from '../logger';

const logger = getLogger('py-config');

/**
 * Configures general metadata about the PyScript application such
 * as a list of runtimes, name, version, closing the loader
 * automatically, etc.
 *
 * Also initializes the different runtimes passed. If no runtime is passed,
 * the default runtime based on Pyodide is used.
 */

export class PyConfig extends BaseEvalElement {
    widths: Array<string>;
    label: string;
    mount_name: string;
    details: HTMLElement;
    operation: HTMLElement;
    values: AppConfig;
    constructor() {
        super();
    }

    connectedCallback() {
        this.code = this.innerHTML;
        this.innerHTML = '';

        const loadedValues = jsyaml.load(this.code);
        if (loadedValues === undefined) {
            this.values = {
                autoclose_loader: true,
                runtimes: [DEFAULT_RUNTIME_CONFIG]
            };
        } else {
            // eslint-disable-next-line
            // @ts-ignore
            this.values = loadedValues;
        }

        appConfig.set(this.values);
        logger.info('config set:', this.values);

        this.loadRuntimes();
    }

    log(msg: string) {
        const newLog = document.createElement('p');
        newLog.innerText = msg;
        this.details.appendChild(newLog);
    }

    close() {
        this.remove();
    }

    loadRuntimes() {
        logger.info('Initializing runtimes');
        for (const runtime of this.values.runtimes) {
            const runtimeObj: Runtime = new PyodideRuntime(runtime.src, runtime.name, runtime.lang);
            const script = document.createElement('script'); // create a script DOM node
            script.src = runtimeObj.src; // set its src to the provided URL



            /* eslint-disable @typescript-eslint/require-await */
            const registerPluginToRuntime = async function(){
                // expose _register_pyscript_plugin to enable plugin registration
                // from Python

                // eslint-disable-next-line
                // @ts-ignore
                runtimeObj.globals.set("_register_pyscript_plugin", createWidget);
            }
            /* eslint-enable @typescript-eslint/require-await */
            addInitializer(registerPluginToRuntime);

            const registerPlugins = async function(){
                // TODO: this needs to be replaced with the list of plugins that is
                //       defined in the py-config plugins section
                const paths = ["./hello.py"];
                for (const path of paths) {
                    logger.info(`loading plugin: ${path}`);
                    try {
                        const source = await getTextFromUrl(path)
                        await runtimeObj.run(source);
                    } catch (e) {
                        //Should we still export full error contents to console?
                        handleFetchError(<Error>e, path);
                    }
                }
            }
            addPostInitializer(registerPlugins);
            script.addEventListener('load', () => {
                void runtimeObj.initialize();
            });
            document.head.appendChild(script);
        }
    }
}
