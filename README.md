# assignment-pedro

Please follow the [instruction](https://coindee.notion.site/Take-Home-Assignment-6d9acbb5f6cb4188b8d272865c2d5177).

### Development environment

Install dependencies
`npm install`

Run orders api http and websocket server
`npm start orders-api`

Run order book react application
`npm start order-book`

### Running test

Orders rest api
`npm run test orders-api`

Order Book react application
`npm run test order-book`

Orders Matching Engine
`npm run test order-matching-engine`

### Repository structure

Mono repository with orders api, order book react application and order matching engine

Repository is bootstrapped with [nx](https://nx.dev/) the applications and libraries are on apps and libs folder

There is an orders rest api and a order book react application under the apps folder and the order matching engine and orders-api-interfaces that is things that are commonly used by the client and the server under the libs folder

### Notes

Sorry if there are a lot of files i tried to do it as realistic as possible, the entry point of the orders api is in `main.ts` under the `orders-api` app that will run the main function of app and start a worker thread to run the order matching engine, it add it by middleware to the request object as part of a context and is accessible in the `orders.router.ts` from there on it communicates between threads through messages.
in the react application i didn't add a router because there was just one page, the orders component displays the order list and create order form, most of the logic and state management is on `use-order-book.hook.ts`
i tried to develop everything without the use of libraries so you can evaluate but probably there are a couple of things that you may want to add libraries for. `order-matching-engine.model.ts` contains the logic to interact with the server and maintain state of the order book and `order-matching-engine.service.ts` contains the most of the logic of the engine (if you restart the server the data of the order book will be wiped because is stored in memory).
i hope you like it :)
