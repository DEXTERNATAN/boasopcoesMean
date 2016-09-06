"use strict";var LocalStrategy=require("passport-local").Strategy,mongoose=require("mongoose"),User=mongoose.model("User"),Remember=mongoose.model("Remember"),path=require("path");module.exports=function(env,passport,transporter){passport.serializeUser(function(user,done){done(null,user._id)}),passport.deserializeUser(function(id,done){User.findById(id,function(err,user){done(err,user)})});var newEndToken=function(cLogin,cId,callback){var newEndToken=new Remember;newEndToken.login=cLogin,newEndToken.serial_id=cId,newEndToken.token=Math.random().toString(36).substr(2,10),newEndToken.save(callback)};passport.use("local-signup",new LocalStrategy({usernameField:"email",passwordField:"password",passReqToCallback:!0},function(req,email,password,done){process.nextTick(function(){User.findOne({email:email},function(err,user){if(err)return done(err);if(user)return done(null,!1,req.flash("signupMessage","email already there"));var validMailKey=Math.random().toString(36).substring(2,10),newUser=new User;newUser.fullname=req.body.fullname,newUser.email=email,newUser.password=newUser.generateHash(password),newUser.emailConfirm=!1,newUser.emailKey=validMailKey,newUser.save(function(err){if(err)throw err;var mailOptions=require(path.join(__dirname,"../../templates/confirm-mail"))(email,req.body.fullname,validMailKey);transporter.sendMail(mailOptions,function(error,info){return error&&console.log(error),console.log(info.response),done(null,newUser)})})})})})),passport.use("local-signin",new LocalStrategy({usernameField:"email",passwordField:"password",passReqToCallback:!0,allowNoField:!0},function(req,email,password,done){if(email&&password)User.findOne({email:email},function(err,user){return err?done(err):user?user.validPassword(password)?req.body.remember?Remember.find({login:email}).remove().exec(function(err){return err?done(err):void newEndToken(email,Math.random().toString(36).substr(2,10),function(err){return err?done(err):done(null,user)})}):done(null,user):done(null,!1,req.flash("signinMessage","Wrong password.")):done(null,!1,req.flash("signinMessage","No user found."))});else{if(!req.cookies||!req.cookies.remember)return done(null,null);var rememberCookie=req.cookies.remember,cookieLogin=rememberCookie.split("#")[0],cookieId=rememberCookie.split("#")[1].substr(0,10),cookieToken=rememberCookie.split("#")[1].replace(cookieId,"");Remember.findOne({login:cookieLogin,serial_id:cookieId}).exec(function(err,endToken){return err?done(err):endToken?void(endToken&&endToken.token!==cookieToken?endToken.remove(function(err){if(err)return done(err);var mailOptions=require(path.join(__dirname,"../../templates/theft-mail"))(cookieLogin);return transporter.sendMail(mailOptions,function(err,info){err&&console.log(err),console.log(info.response)}),done(null,!1,req.flash("signInMessage","theft tentative detected."))}):newEndToken(cookieLogin,cookieId,function(err){return err?done(err):void endToken.remove(function(err){return err?done(err):void User.findOne({email:cookieLogin}).exec(function(err,user){return err?done(err):done(null,user)})})})):done(null,null)})}}))};