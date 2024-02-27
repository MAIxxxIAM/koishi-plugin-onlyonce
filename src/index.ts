import { Context, Schema } from 'koishi'

export const name = 'onlyonce'

export interface Config {}

declare module 'koishi' {
  export interface Tables {
    mutelist: Mutelist
  }
}

export interface Mutelist{
  id?:string
  channelID?:string
}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.model.extend('mutelist', {
    id: 'string',
    channelID:'string',
  }, { primary: 'id' })

  ctx.middleware(async (session, next) => {
    const { userId, channelId } = session
    const userID=userId
    const users = await ctx.database.get('mutelist',{id:userID})
    if(users.length==0){
      return next()
    }
    if(users[0].channelID==channelId){
      const nowTime=new Date()
      const theEnd=new Date(nowTime.getFullYear(),nowTime.getMonth(), nowTime.getDate(), 23, 59, 59, 999)
      const muteTime=theEnd.getTime()-nowTime.getTime()
      await session.bot.muteGuildMember(channelId,userID,muteTime)
      return next()
    }
    return next()
  })
  ctx.command('onlyonce <user>', '只能发一次',{ authority: 4 })
  .action(async ({session})=>{
    const muteMember=session.elements[1].attrs.id
    const channelID=session.channelId
    await ctx.database.create('mutelist',{id:muteMember,channelID:channelID})
    await session.bot.muteGuildMember(channelID,muteMember,1000*60*60*0.5)
  })

  ctx.command('or <user>', '解除禁言',{ authority: 4 })
  .action(async ({session})=>{
    const muteMember=session.elements[1].attrs.id
    const channelID=session.channelId
    await ctx.database.remove('mutelist',{id:muteMember,channelID:channelID})
    await session.bot.muteGuildMember(channelID,muteMember,0)
  })
  
}
