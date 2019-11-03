import ExampleExtensionService from './ExampleExtensionService';
import ConnectedElementsPalette from './ConnectedElementsPalette';

/**
 * A bpmn-js module, defining all extension services and their dependencies.
 *
 * --------
 *
 * WARNING: This is an example only.
 *
 * Make sure you choose a unique name under which your extension service
 * is exposed (i.e. change pluginService_0vcvfg5 to something sensible).
 *
 * --------
 *
 */
export default {
  __init__: [ 'pluginService_0vcvfg5', 'connectedElementsPalette' ],
  pluginService_0vcvfg5: [ 'type', ExampleExtensionService ],
  connectedElementsPalette: [ 'type', ConnectedElementsPalette ]
};
