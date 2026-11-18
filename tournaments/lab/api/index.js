'use strict';
const {createLabHandler}=require('../vercel-handler.cjs');
let handler;
module.exports=(req,res)=>{if(!handler){try{handler=createLabHandler();}catch(e){return res.status(503).json({error:'Laboratory not configured'});}}return handler(req,res);};
