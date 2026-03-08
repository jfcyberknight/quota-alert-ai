
import handler from '../api/v1.js';

const req = {
  method: 'POST',
  headers: {
    authorization: 'Bearer FAKE_TOKEN'
  },
  on: (event, cb) => {
    if (event === 'data') cb(JSON.stringify({ p: 'OpenAI' }));
    if (event === 'end') cb();
  }
};

const res = {
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON:', JSON.stringify(data, null, 2));
  }
};

handler(req, res).catch(console.error);
