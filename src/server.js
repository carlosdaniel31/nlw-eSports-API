const express = require('express');
const cors = require('cors');
const {PrismaClient} = require('@prisma/client');
// const convertStringHourToMinutes = require('./utils/convert');

const app = express();
app.use(cors());
// app.use(cors({
//     origin: 'https://meusite.com.br'
// })); esse é um exemplo de como dizer qual domínio/frontend irá acessar sua api
app.use(express.json())
const prisma = new PrismaClient();

function convertStringHourToMinutes(hourString){
    const [hours, minutes] = hourString.split(':').map(Number)

    const minutesAmount = (hours * 60) + minutes;

    return minutesAmount;
}

function convertMinutesToHourString(minutesAmount){
    const hours = Math.floor(minutesAmount / 60)
    const minutes = minutesAmount % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

app.get('/games', async (req, res)=>{
    const games = await prisma.game.findMany({
        include:{
            _count:{
                select:{
                    ads: true
                }
            }
        }
    })
    return res.json(games)
})

app.post('/games/:id/ads', async (req, res)=>{
    const gameId = req.params.id
    const body = req.body

    const ad = await prisma.ad.create({
        data:{
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertStringHourToMinutes(body.hourStart),
            hourEnd: convertStringHourToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    })
    return res.status(201).json(ad)
})

app.get('/games/:id/ads', async (req, res)=>{
    const gameId = req.params.id
    const ads = await prisma.ad.findMany({
        select:{
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true
        },
        where:{
            gameId
        },
        orderBy:{
            createdAt: 'desc'
        }
    })
    return res.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd)
        }
    }))
})

app.get('/ads/:id/discord', async (req, res)=>{
    const adId = req.params.id

    const ad = await prisma.ad.findUniqueOrThrow({
        select:{
            discord: true
        },
        where:{
            id: adId
        }
    })
    return res.json({
        discord: ad.discord
    })
})

app.listen(8000)