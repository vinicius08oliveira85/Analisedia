// Script de teste para os scrapers
// Execute com: node test-scrapers.js

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testOpenLigaDB() {
  console.log('\n🧪 Testando OpenLigaDB...');
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE}/openligadb?league=bl1&season=2024&date=${today}`);
    const data = await response.json();
    
    if (data.success && data.matches && data.matches.length > 0) {
      console.log(`✅ OpenLigaDB: ${data.matches.length} jogos encontrados`);
      console.log(`   Primeiro jogo: ${data.matches[0].teamA.name} vs ${data.matches[0].teamB.name}`);
      return true;
    } else {
      console.log(`❌ OpenLigaDB: ${data.error || 'Nenhum jogo encontrado'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ OpenLigaDB: Erro - ${error.message}`);
    return false;
  }
}

async function testSoccerway() {
  console.log('\n🧪 Testando Soccerway...');
  try {
    const response = await fetch(`${API_BASE}/scrape-soccerway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.soccerway.com/' })
    });
    const data = await response.json();
    
    if (data.success && data.matches && data.matches.length > 0) {
      console.log(`✅ Soccerway: ${data.matches.length} jogos encontrados`);
      return true;
    } else if (data.isSPA) {
      console.log(`⚠️  Soccerway: É uma SPA - precisa de HTML renderizado`);
      return false;
    } else {
      console.log(`❌ Soccerway: ${data.error || 'Nenhum jogo encontrado'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Soccerway: Erro - ${error.message}`);
    return false;
  }
}

async function testSokkerPro() {
  console.log('\n🧪 Testando SokkerPro...');
  try {
    const response = await fetch(`${API_BASE}/scrape-sokkerpro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://sokkerpro.com/' })
    });
    const data = await response.json();
    
    if (data.success && data.matches && data.matches.length > 0) {
      console.log(`✅ SokkerPro: ${data.matches.length} jogos encontrados`);
      return true;
    } else if (data.isSPA) {
      console.log(`⚠️  SokkerPro: É uma SPA - precisa de HTML renderizado`);
      return false;
    } else {
      console.log(`❌ SokkerPro: ${data.error || 'Nenhum jogo encontrado'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ SokkerPro: Erro - ${error.message}`);
    return false;
  }
}

async function testAcademiaApostas() {
  console.log('\n🧪 Testando Academia das Apostas...');
  try {
    const response = await fetch(`${API_BASE}/scrape-matches?url=https://www.academiadasapostasbrasil.com/`);
    const data = await response.json();
    
    if (data.success && data.matches && data.matches.length > 0) {
      console.log(`✅ Academia das Apostas: ${data.matches.length} jogos encontrados`);
      return true;
    } else {
      console.log(`❌ Academia das Apostas: ${data.error || 'Nenhum jogo encontrado'}`);
      if (data.details) console.log(`   Detalhes: ${data.details}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Academia das Apostas: Erro - ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes dos scrapers...\n');
  
  const results = {
    openligadb: await testOpenLigaDB(),
    soccerway: await testSoccerway(),
    sokkerpro: await testSokkerPro(),
    academia: await testAcademiaApostas()
  };
  
  console.log('\n📊 Resumo dos Testes:');
  console.log(`   OpenLigaDB: ${results.openligadb ? '✅' : '❌'}`);
  console.log(`   Soccerway: ${results.soccerway ? '✅' : '❌'}`);
  console.log(`   SokkerPro: ${results.sokkerpro ? '✅' : '❌'}`);
  console.log(`   Academia das Apostas: ${results.academia ? '✅' : '❌'}`);
  
  const successCount = Object.values(results).filter(r => r).length;
  console.log(`\n✅ ${successCount}/4 testes passaram`);
}

runAllTests().catch(console.error);

