/*
*
*
*       Complete the API routing below
*
*
*/
/*
IEXTRADING - API
  https://iextrading.com/developer/docs/#getting-started
  https://ws-api.iextrading.com/1.0/tops/last?symbols=fb
  --> [{"symbol":"FB","price":181.11,"size":200,"time":1570719174290}]
  https://ws-api.iextrading.com/1.0/tops/last?symbols=fb,googl
  --> [{"symbol":"FB","price":181.225,"size":200,"time":1570719198995},
       {"symbol":"GOOGL","price":1209.93,"size":1,"time":1570718930406}]
*/

'use strict';

const util = require('util')
const request = require('request')

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;

let LOCAL_DB = false

const MONGO_URI = LOCAL_DB ? 
      `mongodb://${process.env.DB_HOSTNAME}:${process.env.DB_PORT}/${process.env.DB_NAME}` : 
      "mongodb+srv://" +
      process.env.DB_USER +
      ":" +
      process.env.DB_PASS +
      "@cluster0-vakli.mongodb.net/test?retryWrites=true&w=majority"

// Database variables
var db         // database connection variable
var stocks     // database collection variable


// Promisify functions to be used later on
const getStockFromExternalAPI = (url) => {
  return new Promise((resolve, reject) => {
    request(url, (err, response, body) => {
      if(err) reject(err)
      resolve(body)
    })
  })
}



// Main function
module.exports = function (app) {

  // Connect database
  MongoClient.connect(MONGO_URI, function(err, database) {
    if (err) console.log("Database couldn't connect")
    else {
      console.log("Database connected")
      db = database.db(process.env.DB_NAME)
      stocks = db.collection('stocks')
    }
  })
  
  app.route('/api/stock-prices')
    //.get(function (req, res){
    .get(async function (req, res){
      console.log("I'm inside the api function!")
    
      // Query parameters
      const stockSymbol = req.query.stock
      const like = (req.query.like === 'true')
      
      // Prepare the query for the external api
      let query_suffix = ''
      if(Array.isArray(stockSymbol)) query_suffix = stockSymbol.join(',')
      else query_suffix = stockSymbol
      
      const url = 'https://ws-api.iextrading.com/1.0/tops/last?symbols=' + query_suffix
      
      // Obtain data from external api
      const stock = JSON.parse(await getStockFromExternalAPI(url))
      
      // Array with the symbols of the stocks included in the query
      const symbolArray = stock.map(s => s.symbol)
      
      // Array to keep track of the "likes" for each stock in the query
      const likesArray = []
      
      // Search in the database for the number of likes of each stock
      for(let i = 0; i < symbolArray.length; i++) {
      
        if(like)
          likesArray[i] = await stocks.findOneAndUpdate(
            { symbol: symbolArray[i] },
            //{ $inc: { likes: increment } },
            { $setOnInsert: { symbol: symbolArray[i] }, 
              $addToSet: { likes: [req.ip] } },
            { upsert: true,
             returnOriginal: false })
          .then(r => r.value.likes.length)
        
        else
          likesArray[i] = await stocks.findOneAndUpdate(
            { symbol: symbolArray[i] },
            { $setOnInsert: { symbol: symbolArray[i], likes: [] } },
            { upsert: true,
             returnOriginal: false })
          .then(r => r.value.likes.length)
        
      }      

      // Prepare the results
      let result = {}
      
      if(symbolArray.length === 1)
        result = { stock: symbolArray[0], price: stock[0].price, likes: likesArray[0] }
    
      else if(symbolArray.length === 2){
        result = []
        result[0] = {stock: symbolArray[0], price: stock[0].price, rel_likes: likesArray[0] - likesArray[1]}
        result[1] = {stock: symbolArray[1], price: stock[1].price, rel_likes: likesArray[1] - likesArray[0]}
      }
    
      // Generic case with stockArray.length > 1, where rel_likes = likes - minLikes
      // (out of the scope of the project)
      /*else if(stockArray.length > 1) {
        
        let minLikes = Math.min(...likesArray)
        result = []
        for(let i = 0; i < stockArray.length; i++) {
          
          result.push({
            stock: stockArray[i], price: stock[i].price, rel_likes: likesArray[i] - minLikes
          })
          
        }
        
      }*/
      
      // Present the results
      //let result = req.query.stock
      return res.json({ stockData: result })
      
  })
    
};