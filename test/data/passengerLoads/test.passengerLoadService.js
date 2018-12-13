// IMPORTS

require('should');

const SERVER_ROOT = './../../';
var passengerLoadService = require('/services/data/passengerLoads/passengerLoadService');
var geolib = require('geolib');

// TESTS

describe('geolib', function () {
  describe('#getDistance', function() {
    it('should return with all OFF when passengerLoads is all OFF.', function() {
      // var passengerLoads = [ 
      //   [ '0', '0', '0', '0', '0', '0', '6:00:00', '1.0', '1.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:00:05', '2.0', '2.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:00:06', '3.0', '3.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:00:10', '4.0', '4.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:00:45', '5.0', '5.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:01:05', '6.0', '6.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:02:00', '7.0', '7.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:03:05', '8.0', '8.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:04:00', '9.0', '9.0' ],
      //   [ '0', '0', '0', '0', '0', '0', '6:05:00', '10.0', '10.0' ]
      // ]

      // var expected = [ 
      //   [ '0', '0', '0', '0', '0', '6:00:00', '1.0', '1.0' ],
      //   [ '0', '0', '0', '0', '0', '6:00:00', '1.0', '1.0' ],
      //   [ '0', '0', '0', '0', '0', '6:00:05', '2.0', '2.0' ],
      //   [ '0', '0', '0', '0', '0', '6:00:06', '3.0', '3.0' ],
      //   [ '0', '0', '0', '0', '0', '6:00:10', '4.0', '4.0' ],
      //   [ '0', '0', '0', '0', '0', '6:00:45', '5.0', '5.0' ],
      //   [ '0', '0', '0', '0', '0', '6:01:05', '6.0', '6.0' ],
      //   [ '0', '0', '0', '0', '0', '6:02:00', '7.0', '7.0' ],
      //   [ '0', '0', '0', '0', '0', '6:03:05', '8.0', '8.0' ],
      //   [ '0', '0', '0', '0', '0', '6:04:00', '9.0', '9.0' ],
      //   [ '0', '0', '0', '0', '0', '6:05:00', '10.0', '10.0' ],
      //   [ '0', '0', '0', '0', '0', '6:05:00', '10.0', '10.0' ] 
      // ]

      // restuls = passengerLoadService.process(passengerLoads);
    });

    it('should return 100 when start is start (0, 0) and end is (0, 0.001).', function() {
      
    })  
  });  
});
  