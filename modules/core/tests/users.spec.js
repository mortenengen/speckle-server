/* istanbul ignore file */
const chai = require( 'chai' )
const chaiHttp = require( 'chai-http' )
const assert = require( 'assert' )
const appRoot = require( 'app-root-path' )

const { init } = require( `${appRoot}/app` )

const expect = chai.expect
chai.use( chaiHttp )

const knex = require( `${appRoot}/db/knex` )

const { createUser, getUser, updateUser, deleteUser, validatePasssword } = require( '../services/users' )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../services/tokens' )

describe( 'Actors & Tokens', ( ) => {
  let myTestActor = {
    username: 'dim',
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  let otherUser = {}

  before( async ( ) => {
    await knex.migrate.rollback( )
    await knex.migrate.latest( )

    let actorId = await createUser( myTestActor )
    myTestActor.id = actorId

  } )

  after( async ( ) => {

  } )


  describe( 'Users', ( ) => {

    it( 'First created user should be a server admin', async ( ) => {

    } )

    it( 'Should create an actor', async ( ) => {
      let newUser = { ...myTestActor }
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.username = 'bill'
      newUser.password = 'testthebest'

      let actorId = await createUser( newUser )
      newUser.id = actorId
      otherUser = { ...newUser }
    } )

    it( 'Should get an actor', async ( ) => {
      let actor = await getUser( myTestActor.id )
      expect( actor ).to.not.have.property( 'passwordDigest' )
    } )

    it( 'Should update an actor', async ( ) => {
      let updatedActor = { ...myTestActor }
      updatedActor.username = 'didimitrie'

      await updateUser( myTestActor.id, updatedActor )

      let actor = await getUser( myTestActor.id )
      expect( actor.username ).to.equal( updatedActor.username )

    } )

    it( 'Should not update password', async ( ) => {
      let updatedActor = { ...myTestActor }
      updatedActor.password = "failwhale"

      await updateUser( myTestActor.id, updatedActor )

      let match = await validatePasssword( { email: myTestActor.email, password: 'failwhale' } )
      expect( match ).to.equal( false )
    } )

    it( 'Should validate user password', async ( ) => {
      let actor = {}
      actor.password = 'super-test-200'
      actor.email = 'e@ma.il'
      actor.username = 'dimitrie'
      actor.name = 'Bob Gates'
      let id = await createUser( actor )

      let match = await validatePasssword( { email: actor.email, password: 'super-test-200' } )
      expect( match ).to.equal( true )
      let match_wrong = await validatePasssword( { email: actor.email, password: 'super-test-2000' })
      expect( match_wrong ).to.equal( false )

    } )
  } )

  describe( 'API Tokens', ( ) => {
    let myFirstToken
    let pregeneratedToken
    let revokedToken
    let someOtherToken
    let expireSoonToken

    before( async ( ) => {
      pregeneratedToken = await createPersonalAccessToken( myTestActor.id, 'Whabadub', [ 'streams:read', 'streams:write', 'profile:read', 'users:email' ] )
      revokedToken = await createPersonalAccessToken( myTestActor.id, 'Mr. Revoked', [ 'streams:read' ] )
      someOtherToken = await createPersonalAccessToken( otherUser.id, 'Hello World', [ 'streams:write' ] )
      expireSoonToken = await createPersonalAccessToken( myTestActor.id, 'Mayfly', [ 'streams:read' ], 1 ) // 1ms lifespan
    } )

    it( 'Should create an personal api token', async ( ) => {
      let scopes = [ 'streams:write', 'profile:read' ]
      let name = 'My Test Token'

      myFirstToken = await createPersonalAccessToken( myTestActor.id, name, scopes )
      expect( myFirstToken ).to.have.lengthOf( 42 )
    } )

    // it( 'Should create an api token for an app', async ( ) => {
    //   let test = await createAppToken( { userId: myTestActor.id, appId: 'spklwebapp' } )
    //   expect( test ).to.have.lengthOf( 42 )
    // } )

    it( 'Should validate a token', async ( ) => {
      let res = await validateToken( pregeneratedToken )
      expect( res ).to.have.property( 'valid' )
      expect( res.valid ).to.equal( true )
      expect( res ).to.have.property( 'scopes' )
      expect( res ).to.have.property( 'userId' )
      expect( res ).to.have.property( 'role' )
    } )

    it( 'Should revoke an api token', async ( ) => {
      await revokeToken( revokedToken, myTestActor.id )
      let res = await validateToken( revokedToken )
      expect( res ).to.have.property( 'valid' )
      expect( res.valid ).to.equal( false )
    } )

    it( 'Should refuse an expired token', async ( ) => {
      let res = await validateToken( expireSoonToken )
      expect( res.valid ).to.equal( false )
      // assert.fail( )
    } )

    it( 'Should get the tokens of an user', async ( ) => {
      let userTokens = await getUserTokens( myTestActor.id )
      expect( userTokens ).to.be.an( 'array' )
      expect( userTokens ).to.have.lengthOf( 2 )
    } )
  } )


} )