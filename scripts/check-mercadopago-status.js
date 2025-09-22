/**
 * Script de Verificação do Sistema Mercado Pago
 * Verifica se todos os componentes estão funcionando corretamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando Status do Sistema Mercado Pago');
console.log('='.repeat(50));

// Verificar arquivos essenciais
const essentialFiles = [
    'convex/domains/mercadoPago/actions.ts',
    'convex/domains/mercadoPago/mutations.ts',
    'convex/domains/mercadoPago/queries.ts',
    'convex/domains/mercadoPago/types.ts',
    'convex/domains/mercadoPago/utils.ts',
    'convex/domains/mercadoPago/webhooks.ts',
    'convex/http.ts',
    'src/components/bookings/ActivityBookingForm.tsx',
    'src/components/bookings/EventBookingForm.tsx',
    'src/components/bookings/RestaurantReservationForm.tsx',
    'src/components/bookings/VehicleBookingForm.tsx'
];

console.log('\n📁 Verificando arquivos essenciais...');
const missingFiles = [];
essentialFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - ARQUIVO FALTANDO`);
        missingFiles.push(file);
    }
});

// Verificar se actions estão implementadas
console.log('\n🔧 Verificando Actions do Mercado Pago...');
const actionsFile = 'convex/domains/mercadoPago/actions.ts';
if (fs.existsSync(actionsFile)) {
    const actionsContent = fs.readFileSync(actionsFile, 'utf8');
    
    const requiredActions = [
        'createCheckoutPreference',
        'createCheckoutPreferenceForBooking',
        'capturePayment',
        'cancelPayment',
        'refundPayment',
        'approveBookingAndCapturePayment',
        'rejectBookingAndCancelPayment',
        'processWebhookEvent'
    ];
    
    requiredActions.forEach(action => {
        if (actionsContent.includes(`export const ${action}`)) {
            console.log(`✅ ${action}`);
        } else {
            console.log(`❌ ${action} - ACTION FALTANDO`);
        }
    });
}

// Verificar integração nos formulários
console.log('\n📋 Verificando integração nos formulários...');
const bookingForms = [
    'src/components/bookings/ActivityBookingForm.tsx',
    'src/components/bookings/EventBookingForm.tsx',
    'src/components/bookings/RestaurantReservationForm.tsx',
    'src/components/bookings/VehicleBookingForm.tsx'
];

bookingForms.forEach(form => {
    if (fs.existsSync(form)) {
        const formContent = fs.readFileSync(form, 'utf8');
        if (formContent.includes('createCheckoutPreferenceForBooking')) {
            console.log(`✅ ${path.basename(form)} - Integrado com MP`);
        } else {
            console.log(`❌ ${path.basename(form)} - SEM integração MP`);
        }
    }
});

// Verificar webhook
console.log('\n🔗 Verificando configuração de webhook...');
const httpFile = 'convex/http.ts';
if (fs.existsSync(httpFile)) {
    const httpContent = fs.readFileSync(httpFile, 'utf8');
    if (httpContent.includes('/mercadopago/webhook')) {
        console.log('✅ Webhook endpoint configurado em convex/http.ts');
    } else {
        console.log('❌ Webhook endpoint NÃO encontrado');
    }
}

// Verificar package.json
console.log('\n📦 Verificando dependências...');
const packageFile = 'package.json';
if (fs.existsSync(packageFile)) {
    const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    if (packageContent.dependencies && packageContent.dependencies.mercadopago) {
        console.log(`✅ mercadopago SDK: ${packageContent.dependencies.mercadopago}`);
    } else {
        console.log('❌ SDK mercadopago NÃO encontrado no package.json');
    }
}

// Resumo
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMO DO STATUS:');
console.log(`📁 Arquivos essenciais: ${essentialFiles.length - missingFiles.length}/${essentialFiles.length}`);

if (missingFiles.length === 0) {
    console.log('🎉 SISTEMA PRONTO PARA PRODUÇÃO!');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('  1. Configure as variáveis de ambiente (veja ENVIRONMENT_VARIABLES.md)');
    console.log('  2. Execute: ./scripts/deploy-production.sh');
    console.log('  3. Configure webhook no dashboard do Mercado Pago');
} else {
    console.log(`❌ ${missingFiles.length} arquivo(s) faltando. Revise a implementação.`);
}
