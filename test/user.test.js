'use strict';

const co = require('co');
const path = require('path');
const Koa = require('koa');
const Router = require('koa-router');
const bodyparser = require('koa-bodyparser');
const convert = require('koa-convert');
const json = require('koa-json');
const service = require('../lib');
const app = new Koa();

app.use(convert(bodyparser()));
app.use(convert(json()));

const Sequelize = require('sequelize');
const sequelize = new Sequelize('sequelize','','', {
    dialect: 'sqlite',
    logging: false,
    storage: path.join(__dirname, '../db.sqlite')
});

const user = sequelize.define('users', {
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    nicename: Sequelize.STRING(36),
    username: {
      type: Sequelize.STRING(36),
      allowNull: false,
      unique: true,
    },
    roles: Sequelize.STRING
}, {
    classMethods: {
      associate: function(models){
        user.hasMany(models.user_meta, {as: 'meta', 'foreignKey': 'uid'});
      }
    },
    freezeTableName: true,
    timestamps: true, //add createAt and updateAt
    createdAt: 'registeredAt'
});

const userMeta = sequelize.define('user_meta', {
    uid: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    key: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    value: Sequelize.TEXT
  }, {
    freezeTableName: true
});

user.associate({user_meta: userMeta});
sequelize.sync();

const router = service(new Router({prefix: '/users'}), { model: user }, {
    before: {
        all: co.wrap(function *(ctx, next){
            ctx.params.sequelize = {
                include: {
                    model: userMeta,
                    as: 'meta'
                }
            };
            yield next();
        })
    },
});
app.use(router.routes());
app.use(router.allowedMethods());

const request = require('supertest');
const server = require('http').createServer(app.callback());

describe('User', function(){
    it('find all', function(done){
        request(server)
            .get('/users')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });

    it('get one', function(done){
        request(server)
            .get('/users/1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200,done);
    });

    it('create', function(done){
        let name = 'Packy'+Date.now();
        let user = {
            email: name+'@uxfeel.com',
            username: name,
            password: '123456',
            meta: [
                {
                    key: 'sex',
                    value: '1'
                },
                {
                    key: 'avatar',
                    value: '/avatar-1.png'
                }
            ]
        };
        request(server)
            .post('/users')
            .send(user)
            .expect('Content-Type', /json/)
            .expect(201, done);
    });

    it('patch', function(done){
        this.timeout(30000);
        request(server)
            .get('/users')
            .end((err, res)=>{
                let user = res.body.data.pop();
                request(server)
                    .put('/users/'+user.id)
                    .send({
                        id: user.id,
                        nicename: user.username
                    })
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .expect((res)=>{
                        if(res.body.password !== user.password) throw new Error('password do not updated!');
                    })
                    .end(done);
            });
    });

    it('Query the user names contain Packy', function(done){
        request(server)
            .get('/users')
            .query({email: {$like: 'Packy'}}) //encodeURIComponent('?email[$like]=Packy')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });

    it('update', function(done){
        this.timeout(30000);
        request(server)
            .get('/users')
            .end((err, res)=>{
                let user = res.body.data.pop();
                user.password = "654321";
                request(server)
                    .put('/users/'+user.id)
                    .send(user)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .expect((res)=>{
                        if(res.body.password !== user.password) throw new Error('password do not updated!');
                    })
                    .end(done);
            });
    });

    it('delete', function(done){
        this.timeout(30000);
        request(server)
            .get('/users')
            .end((err, res)=>{
                let user = res.body.data.pop();
                request(server)
                    .del('/users/'+user.id)
                    .expect('Content-Type', /json/)
                    .expect(200, done);
            });
    });
});