require('should');
var geolib = require('geolib');

describe('geolib', function () {
  describe('#getDistance', function() {
    it('should return the same when start and end are origin.', function() {
      var start = {latitude: 0.0, longitude: 0.0};
      var end = {latitude: 0.0, longitude: 0.0};

      geolib.getDistance(start, end).should.equal(0);

      var start = {latitude: 0.0, longitude: 0.0};
      var end = {latitude: 360.0, longitude: 0.0};

      geolib.getDistance(start, end).should.equal(0);

      var start = {latitude: 0.0, longitude: 0.0};
      var end = {latitude: 0.0, longitude: 360.0};

      geolib.getDistance(start, end).should.equal(0);
    });

    it('should return 100 when start is start (0, 0) and end is (0, 0.001).', function() {
      var start = {latitude: 0.0, longitude: 0.0};
      var end = {latitude: 0.0, longitude: 0.000898};

      geolib.getDistance(start, end).should.equal(100);      
    })  
  });  
});
  