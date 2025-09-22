import { NextRequest, NextResponse } from "next/server";
import {MercadoPagoConfig, Preference} from 'mercadopago'

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
})

export async function POST(request: NextRequest) {
    const preference = new Preference(client)
    
    preference.create({
        body: {
            items: [
                {
                    id: "1",
                    title: "Teste",
                    quantity: 1,
                    unit_price: 2000
                }
            ]      
        }
    }).then((response) => {
        console.log(response)
        return NextResponse.json(response)
    }).catch((error) => {
        console.log(error)
        return NextResponse.json(error)
    })
}

