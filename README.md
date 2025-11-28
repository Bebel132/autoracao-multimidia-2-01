
# Projeto de Desenvolvimento Web: **A Interface do Robô de *Meadowfield***

[Documentação](https://docs.google.com/document/d/1x65AnTIpvhODb_JmmS3B55opCKmujcBTbb189XHUfpM/edit?tab=t.0#heading=h.325gzsbc52ni)

O código já vem com bastante comentarios explicando como algumas coisas funcionam, e o professor ainda deixou claro onde deveria ser feito as alterações principais para desenhar a linha tracejada.

Existem algumas variáveis que controlam e estado da aplicação, e a cada passo que o robô dá na simulação essas variáveis vão sendo atualizadas com algumas informações importantes, tipo o ****currentState**** que guarda, literalmente, pra onde o robô vai e quais são as próximas encomendas: 
```
{
    "place": "Cabin",
    "parcels": [
        {
            "place": "Town Hall",
            "address": "Marketplace"
        },
        {
            "place": "Shop",
            "address": "Grete's House"
        },
        {
            "place": "Town Hall",
            "address": "Daria's House"
        },
        {
            "place": "Cabin",
            "address": "Shop"
        }
    ]
}
```

Então, na função que desenha a vila é passado esse estado: ```drawVillage(currentState);``` e lá é desenhado, junto dos locais, do robô e das ruas, o caminho tracejado de onde o robô vai:

```javascript
function drawVillage(state) {
    [...]

    // na primeira renderização do canvas, o currentRobot é null, e por isso dá erro se for executar esse bloco de código
    // da mesma forma, quando o robô não tem mais o que fazer (entregou todas as encomendas), o state também é null, então esse bloco de código não deve ser executado

    if(typeof currentRobot === 'function' && state) {
        // obtém a próxima ação do robô
        const action = currentRobot(state, robotMemory);

        // verifica se há uma direção válida para desenhar o caminho que o robô seguirá
        if(action.direction) {
            // configurações da linha tracejada
            ctx.strokeStyle = "#ff00d4ff";
            ctx.lineWidth = 5;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            
            // começa do local atual do robô
            let start = locations[state.place];

            // desenha a linha tracejada
            ctx.moveTo(start.x, start.y);
            
            // obtém a localização da próxima direção
            let loc = locations[action.direction];
            
            // desenha até a próxima direção
            ctx.lineTo(loc.x, loc.y);

            // finaliza o desenho da linha tracejada
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    [...]
}
```
## Demonstração

![gif](https://iili.io/fCL16EG.gif)
