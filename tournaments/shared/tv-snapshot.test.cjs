const assert=require('node:assert/strict');const {validate}=require('./tv-snapshot.js');
const result=validate({schemaVersion:1,tournament:'Torneo',matches:[{table:1,round:'Final',teamA:'A',teamB:'B',scoreA:220,scoreB:190,secret:'hidden'}],events:[],bracket:['Final'],adminToken:'secret'});
assert.equal(result.matches[0].scoreA,220);assert.equal(result.matches[0].secret,undefined);assert.equal(result.adminToken,undefined);
assert.equal(validate({schemaVersion:1,matches:[{scoreA:999,scoreB:-1}],events:[],bracket:[]}).matches[0].scoreA,0);
assert.throws(()=>validate({schemaVersion:2,matches:[]}));
console.log('TV snapshot contract checks passed');