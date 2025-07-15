const session = require('express-session');

const userSet = (app) => {
  app.use(session({
    secret: 'abc123',  
    resave: false,     
    saveUninitialized: true,  
    cookie: { 
      secure: true, 
      maxAge: 3600000 
    }
  }));
};
module.exports = userSet