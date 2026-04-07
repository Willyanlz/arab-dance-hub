import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface TermosRegulamentoProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

const TermosRegulamento = ({ accepted, onAcceptedChange }: TermosRegulamentoProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground font-sans">Termos e Regulamento do 9º F.A.D.D.A</h3>
      <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted p-4">
        <div className="space-y-4 text-sm text-foreground/90 font-sans pr-4">
          <section>
            <h4 className="font-bold mb-1">CATEGORIAS DE APRESENTAÇÃO</h4>
            <p><strong>Solo:</strong> Uma única bailarina(o) se apresenta. Tempo de música 03:00min.</p>
            <p><strong>Dupla/Trio:</strong> Duas ou três bailarinas(os) realizam uma coreografia conjunta. Tempo de música 03:00min (podendo ser casal, pais e filhos ou mestre e aluno).</p>
            <p><strong>Grupo:</strong> Quatro ou mais bailarinas(os) apresentam uma coreografia sincronizada. Tempo de música 04:00min (máximo 15 participantes).</p>
          </section>

          <section>
            <h4 className="font-bold mb-1">MODALIDADES E CRITÉRIOS</h4>

            <p><strong>1. Livre/Inspiração:</strong> Estilo totalmente aberto, sem restrições de gênero musical, figurino ou elementos cênicos. Permite fusões e experimentações coreográficas com qualquer estilo de dança exceto músicas árabes. Sugestões: Flamenco, sertanejo, salsa, samba, performance, além de inspirações em filmes, novelas, livros, artistas, séries, época etc.</p>

            <p><strong>2. Moderno/Fusão:</strong> Inclui fusões do estilo tradicional da dança do ventre com outros ritmos, como contemporâneo, flamenco, tribal fusion, entre outros. Entende-se por fusão músicas e movimentações que trabalhem 2 ou mais estilos diferentes com a obrigatoriedade de ser um árabe + o outro estilo escolhido. Permitido o uso de elementos como espada, asas de Ísis, flag, leques, entre outros. Entende-se por moderno músicas remixadas, com roupagem eletrônica, pop árabe e que tenham ou não um momento percussivo.</p>

            <p><strong>3. Folclore Árabe:</strong> Baseado em danças tradicionais do mundo árabe, como Saidi, Khaliji, Dabke, Ghawazee, Meleia Laf, Baladi, Shaabi, Kawleya, Núbia entre outros. O figurino assim como a música deve estar de acordo com o estilo escolhido. Permitido o uso de acessórios/elementos condizentes com a temática escolhida.</p>

            <p><strong>4. Clássico/Tarab:</strong> Baseado na tradição clássica da dança do ventre, enfatizando técnica, interpretação e musicalidade. O repertório deve conter músicas clássicas árabes ou tarab.</p>

            <p><strong>5. Amador:</strong> Destinado a bailarinas(os) que praticam a dança há menos de 3 anos ou sem experiência significativa em competições. Alunas que nunca competiram no semi profissional ou profissional e não são remuneradas para se apresentar e nem ministram aulas. Músicas livres desde que sejam árabes.</p>

            <p><strong>6. Semi Profissional – FILMES COM ELEMENTOS:</strong> Para bailarinas(os) com experiência intermediária com mais de 5 anos de danças árabes. OBRIGATÓRIO O USO DE TEMA FILMES DO INÍCIO AO FIM da apresentação, com uso de 1 ou mais elementos obrigatórios. Sugestões: espada, wings, fan veil, flag, candelabro e taças. PROIBIDO VÉU SIMPLES. Permitidos: véu duplo, 4 ou 7 véus. CAPA é considerada acessório. Pandeiro, bastão e snujs NÃO podem ser utilizados nesta categoria.</p>

            <p><strong>7. Profissional – Clássico/Tarab:</strong> Músicas sorteadas. Destinado a bailarinas(os) que atuam profissionalmente com no mínimo 5 anos de experiência. OBRIGATÓRIO O USO DE VÉU SIMPLES na abertura se a música sorteada for rotina; se for Tarab, o véu não é obrigatório. A bailarina receberá no ato da confirmação uma playlist com as músicas para estudo.</p>

            <p><strong>8. Ballet:</strong> Focado na técnica clássica, postura, precisão das linhas corporais e leveza. Engloba Ballet Clássico de Repertório, Clássico Livre e Neoclássico. A trilha sonora deve ser essencialmente música erudita, instrumental ou adaptações orquestradas. Exige-se figurino tradicional e calçados adequados.</p>

            <p><strong>9. Tribal:</strong> Focado nas vertentes do estilo Tribal, englobando desde ATS/FCBD Format até Tribal Fusion. Valoriza postura marcante, isolamento muscular denso e preciso, fluidez dos braços e presença cênica. Permitido e encorajado o uso de snujs, espadas, cestos e figurinos compostos.</p>

            <p><strong>10. Cigano:</strong> Destinada à representação e pesquisa das danças ciganas de diversas linhagens pelo mundo. A trilha sonora deve ser tradicional ou folclórica condizente com a cultura da região representada. Não são adequadas músicas com roupagem pop ou eletrônica. Figurino característico é obrigatório.</p>

            <p><strong>11. Afro:</strong> Dedicado às danças de matriz africana e suas vertentes afro-brasileiras. Valoriza a forte conexão com o chão, polirritmia, movimentação de tronco e quadril, percussão corporal e energia ancestral. A música deve ser essencialmente percussiva, cantada ou instrumental típica.</p>

            <p><strong>12. Jazz:</strong> Valoriza técnica, expressão corporal, energia e isolamento de movimentos. Engloba Jazz Tradicional, Lyrical Jazz, Jazz Funk e Musical (Broadway). Livre escolha musical e figurino livre. Permitido o uso de elementos cênicos característicos.</p>

            <p><strong>13. Contemporâneo:</strong> Focado na fluidez, respiração, forte expressão emocional, trabalho de chão e desconstrução das linhas clássicas. Total liberdade de escolha musical. Sem restrições de figurino.</p>

            <p><strong>14. Dança de Salão:</strong> Voltada para danças a dois, com foco na técnica de condução e resposta, sincronia, postura e domínio do espaço cênico. Obrigatoriedade do contato físico entre os parceiros na maior parte da coreografia. A música, figurino, atitude cênica e calçados devem corresponder ao ritmo e época do estilo escolhido.</p>
          </section>

          <section>
            <h4 className="font-bold mb-1">REGRAS GERAIS</h4>
            <p><strong>1. Figurino:</strong> Deve estar adequado à categoria escolhida. É proibido o uso de roupas excessivamente reveladoras ou que possam ser consideradas ofensivas.</p>
            <p><strong>2. Música:</strong> O participante deve trazer a música com antecedência de no máximo meia hora antes de sua apresentação para a mesa de organização no formato MP3, em pen drive com faixa única nomeada e assinar a lista de presença. É proibido o uso de músicas com letras ofensivas. Tempo: Solo, duplas e trios 03:00min, para grupos 04:00min.</p>
            <p><strong>3. Pontuação:</strong> Os jurados avaliarão técnica (30%), interpretação (20%), musicalidade (20%), figurino (10%) e presença cênica (20%).</p>
            <p><strong>4. Elementos Cênicos:</strong> Apenas categorias "Moderno/Fusão" e "Livre/Inspiração" podem utilizar adereços que não sejam tradicionais da dança árabe. É PROIBIDO o uso de fogo, água, papel picado ou quaisquer outros que possam prejudicar, sujar o palco ou colocar em perigo as apresentações e participantes.</p>
            <p><strong>5. Desclassificação:</strong> O descumprimento de qualquer regra pode levar à desclassificação do competidor.</p>
          </section>

          <section>
            <h4 className="font-bold mb-1">DIREITOS AUTORAIS E USO DE IMAGEM E SOM</h4>
            <p><strong>1. Cessão de Direitos de Uso:</strong> Ao se inscrever no FADDA, o participante declara estar ciente e concordar que autoriza de forma gratuita, irrevogável e irretratável o uso de sua imagem, nome, voz, figurino, performances e/ou obras artísticas captados durante o evento, para fins de divulgação institucional, promocional, educacional e/ou comercial do festival e de seus parceiros. A autorização abrange todas as formas de mídia e comunicação.</p>
            <p><strong>2. Direitos Autorais de Obras Apresentadas:</strong> O participante que apresentar coreografias ou obras autorais declara que é o legítimo detentor dos direitos autorais da obra ou que possui autorização expressa de seus criadores. Caso ocorra qualquer reivindicação de terceiros, o participante assume total responsabilidade legal.</p>
            <p><strong>3. Captação de Imagens e Áudios:</strong> É proibido o registro, gravação ou transmissão não autorizada de aulas, apresentações e atividades internas do festival por parte dos participantes.</p>
            <p><strong>4. Uso Comercial:</strong> Nenhum participante poderá utilizar imagens, vídeos ou qualquer material captado no evento para fins comerciais próprios sem autorização da organização.</p>
            <p><strong>5. Período de Validade:</strong> Esta cessão de direitos é válida por tempo indeterminado, podendo ser revogada apenas por solicitação expressa e formal do participante.</p>
          </section>

          <section>
            <h4 className="font-bold mb-1">CONSIDERAÇÕES FINAIS</h4>
            <p>1. Após a efetivação da inscrição, não haverá devolução de valores em caso de desistência do participante. Caso a organização por motivos de força maior não possa cumprir com a data e a programação do evento, uma nova data ou local será agendado e comunicado com antecedência. NÃO REEMBOLSAMOS OS VALORES DE INSCRIÇÕES.</p>
            <p>2. A organização não se responsabiliza por danos em veículos estacionados ou qualquer objeto, material ou equipamento de valor esquecido ou deixado em suas dependências.</p>
            <p>3. As dependências serão vistoriadas após a desocupação. Quaisquer danos ou extravios serão de responsabilidade dos envolvidos. É EXPRESSAMENTE PROIBIDO: entrar nos lagos existentes; remover plantas, flores ou elementos do jardim; estacionar veículos sobre áreas gramadas.</p>
            <p>4. O local não possui gerador de energia, ficando isento de eventuais indenizações caso ocorra falta de energia elétrica por motivos alheios à vontade do locador.</p>
            <p>5. Para qualquer ajuizamento fica eleito o Foro da Comarca de Araraquara, com expressa renúncia a qualquer outro, arcando a parte culpada com 20% de honorários advocatícios e custas judiciais ou extrajudiciais.</p>
            <p className="mt-2 font-semibold">Elaine de Fátima da Silva — CNPJ 19.691.477/0001-99</p>
          </section>
        </div>
      </ScrollArea>

      <div className="flex items-start space-x-2 pt-2">
        <Checkbox
          id="termos"
          checked={accepted}
          onCheckedChange={(v) => onAcceptedChange(!!v)}
        />
        <label htmlFor="termos" className="text-sm font-sans text-foreground leading-tight">
          Li e aceito integralmente os termos, regulamento, regras e a cessão de direitos de imagem e som do 9º F.A.D.D.A.
        </label>
      </div>
    </div>
  );
};

export default TermosRegulamento;
