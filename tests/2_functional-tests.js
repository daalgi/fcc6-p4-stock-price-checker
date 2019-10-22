/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'googl' })
        .end(function(err, res){
          assert.equal(res.status, 200)
          assert.property(res.body, 'stockData')
          assert.property(res.body.stockData, 'stock')
          assert.equal(res.body.stockData.stock.toLowerCase(), 'googl')
          assert.property(res.body.stockData, 'price')
          assert.property(res.body.stockData, 'likes')
          done();
          });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'san', like: 'true' })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.property(res.body, 'stockData')
            assert.property(res.body.stockData, 'stock')
            assert.equal(res.body.stockData.stock.toLowerCase(), 'san')
            assert.property(res.body.stockData, 'price')
            assert.property(res.body.stockData, 'likes')
            assert.equal(res.body.stockData.likes, 1)
            done()
          })
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'shv' })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.property(res.body, 'stockData')
            assert.property(res.body.stockData, 'stock')
            assert.equal(res.body.stockData.stock.toLowerCase(), 'shv')
            assert.property(res.body.stockData, 'price')
            assert.property(res.body.stockData, 'likes')
            assert.equal(res.body.stockData.likes, 0)
            done()
          })
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: ['shv', 'googl'] })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.property(res.body, 'stockData')
            assert.isArray(res.body.stockData)
            assert.property(res.body.stockData[0], 'stock')
            assert.equal(res.body.stockData[0].stock.toLowerCase(), 'shv')
            assert.property(res.body.stockData[0], 'price')
            assert.property(res.body.stockData[0], 'rel_likes')
            done()
          })
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: ['shll', 'she'], like: 'true' })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.property(res.body, 'stockData')
            assert.isArray(res.body.stockData)
            assert.property(res.body.stockData[0], 'stock')
            assert.equal(res.body.stockData[0].stock.toLowerCase(), 'shll')
            assert.property(res.body.stockData[0], 'price')
            assert.property(res.body.stockData[0], 'rel_likes')
            assert.equal(res.body.stockData[0].rel_likes, 0)
            assert.equal(res.body.stockData[1].rel_likes, 0)
            done()
          })
      });
      
    });

});
