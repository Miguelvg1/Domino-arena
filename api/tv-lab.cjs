/* Vercel Node function adapter for isolated TV laboratory. No secrets in source. */
'use strict';
const {createLabHandler}=require('../tournaments/lab/vercel-handler.cjs');
module.exports=async(req,res)=>createLabHandler()(req,res);
