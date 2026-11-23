(function () {
'use strict';
window.createTitanesTournamentAuth = function (client) {
 return {
 async getAccessToken(){
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  return data.session?.access_token||null;
 },
 async readTournament(key){
  const {data,error}=await client.from('tournament_lab_history').select('revision,state')
   .eq('tournament_key',key).order('revision',{ascending:false}).limit(1).maybeSingle();
  if(error)throw Error('No se pudo leer el torneo del laboratorio.');
  return data;
 },
 async saveTournament(key,revision,operation,state){
  const {data,error}=await client.rpc('save_tournament_lab_revision',{
   p_key:key,p_revision:revision,p_operation:operation,p_state:state
  });
  if(error)throw Error(error.message);
  return data;
 },
 async organizer(){
  const {data,error}=await client.auth.getUser();
  if(error||!data.user)throw Error('Inicia sesión en Titanes Dominó Laboratorio.');
  const {data:member,error:memberError}=await client.from('members').select('id,role')
   .eq('auth_user_id',data.user.id).eq('active',true).eq('access_status','activo').is('deleted_at',null).maybeSingle();
  if(memberError||!['admin','directiva'].includes(member?.role))throw Error('El gestor está disponible para Presidencia y directiva del laboratorio.');
  const {data:members,error:directoryError}=await client.from('members').select('id,nickname,full_name')
   .eq('active',true).eq('access_status','activo').is('deleted_at',null).order('full_name');
  if(directoryError)throw Error('No se pudo cargar el directorio experimental.');
  return {...member,members};
 }
};
};
})();
