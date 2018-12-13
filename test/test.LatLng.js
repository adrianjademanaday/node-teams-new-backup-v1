require('should');
var LatLng = require('./../models/LatLng');

describe('LatLng', function() {

  describe('#addHorizontalDistance', function() {
    var point = new LatLng(14.654525, 121.035213);

    it('should add distance to the left', function() {      
      result = point.addLeft(50);

      result.getFormattedLat().should.equal(14.654525);
      result.getFormattedLng().should.equal(121.034764);
    });  	

    it('should add distance to the right', function () {
      result = point.addRight(50);

      result.getFormattedLat().should.equal(14.654525);
      result.getFormattedLng().should.equal(121.035662);
    });

    it('should add distance to the top', function () {
      result = point.addTop(50);

      result.getFormattedLat().should.equal(14.654974);
      result.getFormattedLng().should.equal(121.035213);
    });

    it('should add distance to the bottom', function () {
      result = point.addBottom(50);

      result.getFormattedLat().should.equal(14.654076);
      result.getFormattedLng().should.equal(121.035213);
    });
  });
});