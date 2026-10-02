let mapa;
let marcador;
let circuloPrecisao;
let primeiraPosicao = true;

const CHAVE_STORAGE = 'ultimaLocalizacao';
const CENTRO_PADRAO = { lat: -15.793889, lng: -47.882778 };

const elLat = document.getElementById('lat');
const elLong = document.getElementById('long');
const elAcc = document.getElementById('acc');
const elTextoUltima = document.getElementById('textoUltima');
const ultimaCard = document.getElementById('ultimaCard');
const btnAtualizar = document.getElementById('btnAtualizar');
const papel = document.getElementById('papel');
const lixeira = document.getElementById('lixeira');
const statusEl = document.getElementById('status');
const statusTexto = document.getElementById('statusTexto');

function definirStatus(texto, erro = false) {
    statusTexto.textContent = texto;
    statusEl.classList.toggle('erro', erro);
}

function mostrarUltimaLocalizacao() {
    const dados = localStorage.getItem(CHAVE_STORAGE);

    if (dados) {
        const { lat, long } = JSON.parse(dados);
        elTextoUltima.textContent = `${lat.toFixed(6)}, ${long.toFixed(6)}`;
        ultimaCard.classList.remove('vazia');
    } else {
        elTextoUltima.textContent = 'Nenhuma localização salva ainda.';
        ultimaCard.classList.add('vazia');
    }
}

function criarMarcadorPersonalizado() {
    const div = document.createElement('div');
    div.className = 'marcador-pulso';
    return div;
}

window.iniciarMapa = function () {
    mapa = new google.maps.Map(document.getElementById('map'), {
        center: CENTRO_PADRAO,
        zoom: 15,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#0f1629' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1629' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#7a8ba8' }] },
            { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1c2c47' }] },
            { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5b6b87' }] },
            { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0e2a22' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2740' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1626' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8fa3c2' }] },
            { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1c2c47' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1a2f' }] },
            { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4b6b8e' }] }
        ]
    });

    const salva = localStorage.getItem(CHAVE_STORAGE);
    if (salva) {
        const { lat, long } = JSON.parse(salva);
        mapa.setCenter({ lat, lng: long });
    }

    capturarLocalizacao();
    definirStatus('Pronto para localizar');
};

function capturarLocalizacao() {
    if (!navigator.geolocation) {
        definirStatus('Geolocalização não suportada', true);
        alert('Seu navegador não suporta geolocalização.');
        return;
    }

    definirStatus('Buscando sinal GPS...');
    elLat.textContent = '...';
    elLong.textContent = '...';
    elAcc.textContent = '...';

    navigator.geolocation.getCurrentPosition(
        (posicao) => {
            const { latitude, longitude, accuracy } = posicao.coords;

            elLat.textContent = latitude.toFixed(6);
            elLong.textContent = longitude.toFixed(6);
            elAcc.textContent = `${accuracy.toFixed(1)} m`;

            definirStatus('Localização capturada ✓');

            const dados = { lat: latitude, long: longitude, acc: accuracy };
            localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));

            mostrarUltimaLocalizacao();

            if (mapa) {
                const pos = { lat: latitude, lng: longitude };

                if (primeiraPosicao) {
                    mapa.setCenter(pos);
                    mapa.setZoom(17);
                    primeiraPosicao = false;
                } else {
                    mapa.panTo(pos);
                }

                if (marcador) marcador.setMap(null);
                if (circuloPrecisao) circuloPrecisao.setMap(null);

                marcador = new google.maps.Marker({
                    position: pos,
                    map: mapa,
                    title: 'Você está aqui',
                    icon: {
                        url: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="14" fill="#00e0a4" fill-opacity="0.25"/>
                                <circle cx="20" cy="20" r="8" fill="#00e0a4" stroke="#ffffff" stroke-width="2"/>
                                <circle cx="20" cy="20" r="3" fill="#ffffff"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 20)
                    },
                    animation: google.maps.Animation.DROP
                });

                circuloPrecisao = new google.maps.Circle({
                    map: mapa,
                    center: pos,
                    radius: accuracy,
                    fillColor: '#00e0a4',
                    fillOpacity: 0.12,
                    strokeColor: '#00e0a4',
                    strokeOpacity: 0.4,
                    strokeWeight: 1
                });
            }
        },
        (erro) => {
            console.error('Erro de geolocalização:', erro);
            let msg = 'Erro ao obter localização.';

            switch (erro.code) {
                case erro.PERMISSION_DENIED:
                    msg = 'Permissão negada pelo usuário'; break;
                case erro.POSITION_UNAVAILABLE:
                    msg = 'Posição indisponível'; break;
                case erro.TIMEOUT:
                    msg = 'Tempo esgotado ao buscar GPS'; break;
            }

            definirStatus(msg, true);
            elLat.textContent = '--';
            elLong.textContent = '--';
            elAcc.textContent = '--';
        },
        {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0
        }
    );
}

papel.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', 'papel');
    e.dataTransfer.effectAllowed = 'move';
    papel.classList.add('arrastando');
    lixeira.style.transform = 'scale(1.05)';
});

papel.addEventListener('dragend', () => {
    papel.classList.remove('arrastando');
    lixeira.classList.remove('over');
    lixeira.style.transform = '';
});

lixeira.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    lixeira.classList.add('over');
});

lixeira.addEventListener('dragleave', () => {
    lixeira.classList.remove('over');
});

lixeira.addEventListener('drop', (e) => {
    e.preventDefault();
    lixeira.classList.remove('over');
    lixeira.classList.add('sucesso');

    localStorage.removeItem(CHAVE_STORAGE);

    mostrarUltimaLocalizacao();
    elLat.textContent = '--';
    elLong.textContent = '--';
    elAcc.textContent = '--';

    definirStatus('Dados apagados com sucesso ✓');

    if (marcador) { marcador.setMap(null); marcador = null; }
    if (circuloPrecisao) { circuloPrecisao.setMap(null); circuloPrecisao = null; }

    primeiraPosicao = true;

    setTimeout(() => lixeira.classList.remove('sucesso'), 900);
});

btnAtualizar.addEventListener('click', capturarLocalizacao);

window.addEventListener('DOMContentLoaded', mostrarUltimaLocalizacao);