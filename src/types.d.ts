/**
 * @class
 */
declare class WebSockets {
    /**
     *
     * @param {*} ma
     * @param {object} options
     * @param {function} callback
     */
    dial(ma: any, options: any, callback: (...params: any[]) => any): void;
    /**
     *
     * @param {object} options
     * @param {function} handler
     */
    createListener(options: any, handler: (...params: any[]) => any): void;
    /**
     *
     * @param {*} multiaddrs
     */
    filter(multiaddrs: any): void;
}

/**
 * @module js-libp2p-websockets/listener
 */
declare module "js-libp2p-websockets/listener" {
    /**
     * Listener
     * @param {*} options
     * @param {*} handler
     */
    function listener(options: any, handler: any): void;
}

