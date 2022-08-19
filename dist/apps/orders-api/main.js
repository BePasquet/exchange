/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/orders-api/src/app/app.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = void 0;
const tslib_1 = __webpack_require__("tslib");
const orders_api_interfaces_1 = __webpack_require__("./libs/orders-api-interfaces/src/index.ts");
const cors = __webpack_require__("cors");
const express = __webpack_require__("express");
const http_1 = __webpack_require__("http");
const uuid = __webpack_require__("uuid");
const worker_threads_1 = __webpack_require__("worker_threads");
const ws_1 = __webpack_require__("ws");
const engine_worker_messages_enum_1 = __webpack_require__("./apps/orders-api/src/app/engine-worker/data/engine-worker-messages.enum.ts");
const orders_router_1 = __webpack_require__("./apps/orders-api/src/app/orders/orders.router.ts");
const orders_service_1 = __webpack_require__("./apps/orders-api/src/app/orders/orders.service.ts");
/**
 * Main thread entry point, starts order matching engine, http and websocket server
 */
function main() {
    const app = express();
    // Middleware
    app.use(cors({ origin: ['http://localhost:4200'] }));
    app.use(express.json());
    const server = (0, http_1.createServer)(app);
    const websocketServer = new ws_1.Server({ server, path: '/order-book' });
    /**
     * Keeps track of the limit of book entries requested for each client
     */
    const clientsLimits = new Map();
    /**
     * When a client connects adds the requested limit of entires to a client limit dictionary
     */
    websocketServer.addListener('connection', (client, request) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a;
        const limit = (0, orders_service_1.getOrderBookLimit)((_a = request.url) !== null && _a !== void 0 ? _a : '');
        const id = uuid.v4();
        client.id = id;
        clientsLimits.set(id, limit);
        client.once('close', () => {
            clientsLimits.delete(id);
        });
    }));
    /**
     * Starts order matching engine on worker thread
     * note: this has to be run in a place where there is a check for the main thread check: ```main.ts```
     */
    const engineWorker = new worker_threads_1.Worker(__filename);
    /**
     * Set up a listener for workers thread messages
     */
    engineWorker.on('message', (message) => {
        if (message.type === engine_worker_messages_enum_1.EngineWorkerEvents.OrderBookChange) {
            // Notifies clients connected to websocket server that the order book has changed
            websocketServer.clients.forEach((client) => {
                var _a;
                const limit = client.id
                    ? (_a = clientsLimits.get(client.id)) !== null && _a !== void 0 ? _a : orders_api_interfaces_1.DEFAULT_ORDER_BOOK_LIMIT
                    : orders_api_interfaces_1.DEFAULT_ORDER_BOOK_LIMIT;
                return client.send(JSON.stringify({
                    type: orders_api_interfaces_1.SocketMessageType.OrderBookChange,
                    payload: (0, orders_service_1.getOrderBookWithLimit)(message.payload, limit),
                }));
            });
        }
    });
    /**
     * Middleware to pass reference to the engine worker through request object
     */
    app.use((req, _, next) => {
        req.engineWorker = engineWorker;
        next();
    });
    app.use('/orders', orders_router_1.ordersRouter);
    const port = process.env.port || 3333;
    server
        .listen(port, () => console.log(`Listening on port ${port}`))
        .on('error', (err) => {
        console.error(err);
        websocketServer.removeAllListeners();
        engineWorker.removeAllListeners();
    });
}
exports.main = main;


/***/ }),

/***/ "./apps/orders-api/src/app/engine-worker/data/engine-worker-messages.enum.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EngineWorkerEvents = void 0;
var EngineWorkerEvents;
(function (EngineWorkerEvents) {
    EngineWorkerEvents["ProcessOrder"] = "PROCESS_ORDER";
    EngineWorkerEvents["OrderBookChange"] = "ORDER_BOOK_CHANGE";
    EngineWorkerEvents["GetSnapshot"] = "GET_SNAPSHOT";
})(EngineWorkerEvents = exports.EngineWorkerEvents || (exports.EngineWorkerEvents = {}));


/***/ }),

/***/ "./apps/orders-api/src/app/engine-worker/engine-worker.service.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getOrderBookSnapshot = void 0;
const orders_api_interfaces_1 = __webpack_require__("./libs/orders-api-interfaces/src/index.ts");
const orders_service_1 = __webpack_require__("./apps/orders-api/src/app/orders/orders.service.ts");
const engine_worker_messages_enum_1 = __webpack_require__("./apps/orders-api/src/app/engine-worker/data/engine-worker-messages.enum.ts");
function getOrderBookSnapshot(engineWorker, { timeout = 1000, limit = orders_api_interfaces_1.DEFAULT_ORDER_BOOK_LIMIT, }) {
    return new Promise((resolve, reject) => {
        // timeouts if doesn't receive a message in specified time
        const timerId = setTimeout(() => {
            reject('timeout');
        }, timeout);
        const onMessage = (message) => {
            if (message.type === engine_worker_messages_enum_1.EngineWorkerEvents.GetSnapshot) {
                const orderBook = (0, orders_service_1.getOrderBookWithLimit)(message.payload, limit);
                resolve(orderBook);
                removeListeners();
            }
        };
        const onError = (err) => {
            reject(err);
            removeListeners();
        };
        const onExit = (code) => {
            if (code !== 0) {
                reject(code);
                removeListeners();
            }
        };
        const removeListeners = () => {
            engineWorker.removeListener('message', onMessage);
            engineWorker.removeListener('error', onError);
            engineWorker.removeListener('exit', onExit);
            clearTimeout(timerId);
        };
        engineWorker.on('message', onMessage);
        engineWorker.on('error', onError);
        engineWorker.on('exit', onExit);
        engineWorker.postMessage({ type: engine_worker_messages_enum_1.EngineWorkerEvents.GetSnapshot });
    });
}
exports.getOrderBookSnapshot = getOrderBookSnapshot;


/***/ }),

/***/ "./apps/orders-api/src/app/engine-worker/engine.worker.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderMatchingEngine = void 0;
const order_matching_engine_1 = __webpack_require__("./libs/order-matching-engine/src/index.ts");
const worker_threads_1 = __webpack_require__("worker_threads");
const engine_worker_messages_enum_1 = __webpack_require__("./apps/orders-api/src/app/engine-worker/data/engine-worker-messages.enum.ts");
exports.orderMatchingEngine = new order_matching_engine_1.OrderMatchingEngine();
exports.orderMatchingEngine.subscribe((orderBook) => worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
    type: engine_worker_messages_enum_1.EngineWorkerEvents.OrderBookChange,
    payload: orderBook,
}));
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.on('message', (message) => {
    switch (message.type) {
        case engine_worker_messages_enum_1.EngineWorkerEvents.ProcessOrder:
            exports.orderMatchingEngine.processOrder(message.payload);
            break;
        case engine_worker_messages_enum_1.EngineWorkerEvents.GetSnapshot:
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({
                type: engine_worker_messages_enum_1.EngineWorkerEvents.GetSnapshot,
                payload: exports.orderMatchingEngine.snapshot(),
            });
            break;
    }
});


/***/ }),

/***/ "./apps/orders-api/src/app/orders/orders.router.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ordersRouter = void 0;
const tslib_1 = __webpack_require__("tslib");
const orders_api_interfaces_1 = __webpack_require__("./libs/orders-api-interfaces/src/index.ts");
const express_1 = __webpack_require__("express");
const uuid = __webpack_require__("uuid");
const engine_worker_messages_enum_1 = __webpack_require__("./apps/orders-api/src/app/engine-worker/data/engine-worker-messages.enum.ts");
const engine_worker_service_1 = __webpack_require__("./apps/orders-api/src/app/engine-worker/engine-worker.service.ts");
const request_validator_middleware_1 = __webpack_require__("./apps/orders-api/src/app/utils/request-validator.middleware.ts");
exports.ordersRouter = (0, express_1.Router)();
exports.ordersRouter.get('/book', ({ query, engineWorker }, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(query.limit, 10) || orders_api_interfaces_1.DEFAULT_ORDER_BOOK_LIMIT;
        const result = yield (0, engine_worker_service_1.getOrderBookSnapshot)(engineWorker, {
            limit,
        });
        res.json({ result });
    }
    catch (e) {
        // add to monitoring
        console.log(e);
        res.status(500).json({
            code: 500,
            message: 'Sorry there was an error please try again later',
        });
    }
}));
exports.ordersRouter.post('/', (0, request_validator_middleware_1.requestValidator)({ schema: orders_api_interfaces_1.orderSchema }), ({ engineWorker, body }, res) => {
    engineWorker === null || engineWorker === void 0 ? void 0 : engineWorker.postMessage({
        type: engine_worker_messages_enum_1.EngineWorkerEvents.ProcessOrder,
        payload: body,
    });
    const newOrder = Object.assign({ id: uuid.v4() }, body);
    res.json({ result: newOrder });
});


/***/ }),

/***/ "./apps/orders-api/src/app/orders/orders.service.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getOrderBookWithLimit = exports.getOrderBookLimit = void 0;
const orders_api_interfaces_1 = __webpack_require__("./libs/orders-api-interfaces/src/index.ts");
/**
 * Parses the limit of entries of order book from the url query params
 * returns a default limit when not preset
 * @param url to extract limit
 */
function getOrderBookLimit(url) {
    var _a;
    if (!url) {
        return orders_api_interfaces_1.DEFAULT_ORDER_BOOK_LIMIT;
    }
    const params = new URLSearchParams(url === null || url === void 0 ? void 0 : url.slice(url.indexOf('?')));
    const limit = parseInt((_a = params.get('limit')) !== null && _a !== void 0 ? _a : '', 10) || orders_api_interfaces_1.DEFAULT_ORDER_BOOK_LIMIT;
    return limit;
}
exports.getOrderBookLimit = getOrderBookLimit;
/**
 * Slice the order book by a specified limit per order (asks, bids) the limit is per order type
 * ex: limit = 10 will mean 10 asks and 10 bids orders
 * @param book the order book
 * @param limit number entries we need
 */
function getOrderBookWithLimit(book, limit) {
    const asks = book.asks.length > limit ? book.asks.slice(0, limit) : book.asks;
    const bids = book.bids.length > limit ? book.bids.slice(0, limit) : book.bids;
    return { asks, bids };
}
exports.getOrderBookWithLimit = getOrderBookWithLimit;


/***/ }),

/***/ "./apps/orders-api/src/app/utils/request-validator.middleware.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.requestValidator = void 0;
function requestValidator({ schema, key = 'body', convert = false, }) {
    return (req, res, next) => {
        const { error } = schema.validate(req[key], {
            convert,
        });
        if (!error) {
            return next();
        }
        const message = error.details.map(({ message }) => message);
        res.status(422).json({ message });
    };
}
exports.requestValidator = requestValidator;


/***/ }),

/***/ "./libs/order-matching-engine/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrderMatchingEngine = void 0;
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/order-matching-engine/src/lib/data/index.ts"), exports);
var order_matching_engine_model_1 = __webpack_require__("./libs/order-matching-engine/src/lib/engine/order-matching-engine.model.ts");
Object.defineProperty(exports, "OrderMatchingEngine", ({ enumerable: true, get: function () { return order_matching_engine_model_1.OrderMatchingEngine; } }));


/***/ }),

/***/ "./libs/order-matching-engine/src/lib/data/book-entry.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/order-matching-engine/src/lib/data/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/order-matching-engine/src/lib/data/book-entry.interface.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/order-matching-engine/src/lib/data/order-book.interface.ts"), exports);


/***/ }),

/***/ "./libs/order-matching-engine/src/lib/data/order-book.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/order-matching-engine/src/lib/engine/order-matching-engine.model.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrderMatchingEngine = void 0;
const events_1 = __webpack_require__("events");
const order_matching_engine_service_1 = __webpack_require__("./libs/order-matching-engine/src/lib/engine/order-matching-engine.service.ts");
class OrderMatchingEngine {
    constructor() {
        /**
         * Order book state
         */
        this.orderBook = {
            asks: [],
            bids: [],
        };
        /**
         * Used to notify subscribers of a change in the order book
         */
        this.emitter = new events_1.EventEmitter();
    }
    /**
     * Process an order against the order book
     * @param order to be processed
     */
    processOrder(order) {
        (0, order_matching_engine_service_1.matchOrder)(this.orderBook, order);
        this.emitter.emit('orderBookChange', this.orderBook);
    }
    /**
     * Synchronously returns a snapshot of the order book at a given point in time
     */
    snapshot() {
        return { asks: [...this.orderBook.asks], bids: [...this.orderBook.bids] };
    }
    /**
     * Once applied will notify of order book changes via the subscriber function
     * @param subscriber function to be called every time the order book change
     * @returns a clean up function that once is called will unsubscribe from the order book change
     * not delivering anymore changes to the subscriber and releasing resources
     */
    subscribe(subscriber) {
        this.emitter.addListener('orderBookChange', subscriber);
        return () => {
            this.emitter.removeListener('orderBookChange', subscriber);
        };
    }
}
exports.OrderMatchingEngine = OrderMatchingEngine;


/***/ }),

/***/ "./libs/order-matching-engine/src/lib/engine/order-matching-engine.service.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.matchOrder = exports.updateVolume = exports.isOrderMatch = exports.insertOrder = void 0;
const orders_api_interfaces_1 = __webpack_require__("./libs/orders-api-interfaces/src/index.ts");
/**
 * Inserts an order on the correct place depending of its price and volume
 * when there is an entry on the book that has the same price than the order
 * it adds the order volume to the entry, when there is no entry with that price
 * it adds an entry with that price and volume in the correct place to maintain the
 * entries sorted
 * NOTE: insertOrder assumes that book input containing the entries is sorted
 * @param params -
 * - book: entries to insert the order in
 * - order: order to be inserted
 * - start: for internal use
 * - end: for internal use
 */
function insertOrder({ book, order, start = 0, end = book.length - 1, }) {
    // didn't find it start is the index where to insert it
    if (start > end) {
        book.splice(start, 0, { price: order.price, volume: order.volume });
        return;
    }
    const mid = Math.floor((start + end) / 2);
    const entry = book[mid];
    // found the same price
    if (entry.price === order.price) {
        entry.volume = entry.volume + order.volume;
        return;
    }
    // go left
    if (order.type === orders_api_interfaces_1.OrderType.Ask
        ? entry.price > order.price
        : entry.price < order.price) {
        return insertOrder({ book, order, start, end: mid - 1 });
    }
    // go right
    if (order.type === orders_api_interfaces_1.OrderType.Ask
        ? entry.price < order.price
        : entry.price > order.price) {
        return insertOrder({ book, order, start: mid + 1, end });
    }
}
exports.insertOrder = insertOrder;
/**
 * Determines whether an order match based on its price, type and volume
 * orders match to an entry when an asking price is smaller or equal that a entry (bid) price
 * a biding price is bigger or equal that a entry (ask) price
 * @param order to test against entry
 * @param entry to test against order
 */
function isOrderMatch(order, entry) {
    if (order.volume <= 0) {
        return false;
    }
    return order.type === orders_api_interfaces_1.OrderType.Ask
        ? order.price <= entry.price
        : order.price >= entry.price;
}
exports.isOrderMatch = isOrderMatch;
/**
 * Given a set of entries and an order will update the entries volume
 * till the order price match and volume is positive, when the whole entry volume
 * is consumed the entry will be removed, when is partially consumed will update
 * the volume accordingly
 * @param params -
 * - entries: to match against order when order (when order type is ask entries should be the list of bids and vice versa)
 * - order: to be match
 * - index: for internal use
 * - floatingPoints: number of floating points to fix the volume
 */
function updateVolume({ entries, order, index = 0, floatingPoints = 8, }) {
    // base case: has gone over all entries or there is no match
    if (index >= entries.length || !isOrderMatch(order, entries[index])) {
        return order.volume;
    }
    const delta = entries[index].volume - order.volume;
    const fixedDelta = parseFloat(delta.toFixed(floatingPoints));
    // order has been match completely and there is still volume on the entry
    if (fixedDelta > 0) {
        entries[index].volume = fixedDelta;
        order.volume = 0;
        return order.volume;
    }
    // remove entry because all volume has been consumed
    entries.splice(index, 1);
    // set order new volume to delta absolute
    order.volume = Math.abs(fixedDelta);
    // there is no need to increment index because we had remove the current element at that index
    // so recursion will execute with the following one
    // example: [{ price: 58.500, volume: 0.02 }, { price: 57.600, volume: 0.01 }]
    // removing element with price: 58.500 at index 0 will place element with price: 57.600 at index 0
    return updateVolume({ entries, order, index, floatingPoints });
}
exports.updateVolume = updateVolume;
/**
 * Matches an order depending on its type to an order book, an order book is compose by the accumulated volume of asks (selling) orders and bids (buying) orders by price,
 * where the best asking price is the lowest price in the asks and the best selling price is the highest price in the bids.
 * orders are match depending its price and volume as following:
 * when an order is processed a match will mean that a bid order price is bigger or equal to a set of asking orders or an ask price is smaller or equal to a set of biding orders
 * in this case the book orders volume will be depleted till the order volume is 0, when an entry volume is depleted in its totality it will be removed from the set.
 * when an order doesn't match or its volume couldn't be consume in its totality will be placed in the opposite side with the price and the remaining volume.
 * NOTE: ASSUMES THAT ASKS ORDERS ARE SORTED ASCENDING AND BIDS ORDERS ARE SORTED IN DESCENDING DEPENDING ON ITS PRICE
 * @param orderBook: to match orders against
 * @param order: to match order book against
 */
function matchOrder(orderBook, order) {
    const scanKey = order.type == orders_api_interfaces_1.OrderType.Ask ? 'bids' : 'asks';
    const remainingVolume = updateVolume({ entries: orderBook[scanKey], order });
    // we have match order volume total against order book
    if (remainingVolume <= 0) {
        return;
    }
    const insertionKey = order.type == orders_api_interfaces_1.OrderType.Ask ? 'asks' : 'bids';
    // adds to volume when same price or insert in correct position to maintain array sorted
    insertOrder({ book: orderBook[insertionKey], order });
}
exports.matchOrder = matchOrder;


/***/ }),

/***/ "./libs/orders-api-interfaces/src/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/index.ts"), exports);


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/const/default-order-book-limit.const.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_ORDER_BOOK_LIMIT = void 0;
exports.DEFAULT_ORDER_BOOK_LIMIT = 20;


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/enum/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/enum/order-type.enum.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/enum/socket-message-type.enum.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/enum/trade-symbol.enum.ts"), exports);


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/enum/order-type.enum.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["Ask"] = "ASK";
    OrderType["Bid"] = "BID";
})(OrderType = exports.OrderType || (exports.OrderType = {}));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/enum/socket-message-type.enum.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SocketMessageType = void 0;
var SocketMessageType;
(function (SocketMessageType) {
    SocketMessageType["Subscribe"] = "SUBSCRIBE";
    SocketMessageType["OrderBookChange"] = "ORDER_BOOK_CHANGE";
})(SocketMessageType = exports.SocketMessageType || (exports.SocketMessageType = {}));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/enum/trade-symbol.enum.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TradeSymbol = void 0;
var TradeSymbol;
(function (TradeSymbol) {
    TradeSymbol["BTC"] = "BTC";
})(TradeSymbol = exports.TradeSymbol || (exports.TradeSymbol = {}));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/const/default-order-book-limit.const.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/enum/index.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/interfaces/index.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/types/index.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/validators/order.validator.ts"), exports);


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/interfaces/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/interfaces/order.interface.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/interfaces/pagination.interface.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/interfaces/server-error.interface.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/interfaces/server-response.interface.ts"), exports);
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/interfaces/subscribe-message.interface.ts"), exports);


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/interfaces/order.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/interfaces/pagination.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/interfaces/server-error.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/interfaces/server-response.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/interfaces/subscribe-message.interface.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/types/create-order.type.ts":
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/types/index.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
tslib_1.__exportStar(__webpack_require__("./libs/orders-api-interfaces/src/lib/types/create-order.type.ts"), exports);


/***/ }),

/***/ "./libs/orders-api-interfaces/src/lib/validators/order.validator.ts":
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.orderSchema = void 0;
const joi = __webpack_require__("joi");
const enum_1 = __webpack_require__("./libs/orders-api-interfaces/src/lib/enum/index.ts");
const TRADE_SYMBOLS = Object.values(enum_1.TradeSymbol);
const ORDER_TYPES = Object.values(enum_1.OrderType);
exports.orderSchema = joi.object().keys({
    price: joi.number().greater(0).precision(2).required(),
    volume: joi.number().greater(0).precision(8).required(),
    symbol: joi
        .any()
        .allow(...TRADE_SYMBOLS)
        .required(),
    type: joi
        .any()
        .allow(...ORDER_TYPES)
        .required(),
});


/***/ }),

/***/ "cors":
/***/ ((module) => {

module.exports = require("cors");

/***/ }),

/***/ "events":
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "express":
/***/ ((module) => {

module.exports = require("express");

/***/ }),

/***/ "joi":
/***/ ((module) => {

module.exports = require("joi");

/***/ }),

/***/ "tslib":
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),

/***/ "uuid":
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),

/***/ "ws":
/***/ ((module) => {

module.exports = require("ws");

/***/ }),

/***/ "http":
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "worker_threads":
/***/ ((module) => {

module.exports = require("worker_threads");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__("tslib");
const worker_threads_1 = __webpack_require__("worker_threads");
function init() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            if (worker_threads_1.isMainThread) {
                const { main } = yield Promise.resolve().then(() => __webpack_require__("./apps/orders-api/src/app/app.ts"));
                main();
            }
            else {
                yield Promise.resolve().then(() => __webpack_require__("./apps/orders-api/src/app/engine-worker/engine.worker.ts"));
            }
        }
        catch (e) {
            // todo add monitoring
            console.log(e);
        }
    });
}
init();

})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=main.js.map