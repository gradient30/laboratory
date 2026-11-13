// Frozen whole-state client handlers from the pre-v2 application.
// Test upgrade errors without changing the cached client behavior.
async function flushSave(){
 clearTimeout(saveTimer);if(saving)return saving;if(!dirty||!session||!activeChild||loadedChildId!==activeChild.id||saveConflict)return !dirty;
 const epoch=contextEpoch,childId=activeChild.id,version=saveVersion,snapshot=JSON.parse(JSON.stringify(state)),expectedRevision=revision;
 saveError='';const operation=(async()=>{try{
  const result=await api('/api/children/'+encodeURIComponent(childId)+'/state',{method:'PUT',body:{revision:expectedRevision,state:snapshot}});
  if(epoch!==contextEpoch||childId!==activeChild?.id)return false;revision=result.revision;const accessChanged=JSON.stringify(access)!==JSON.stringify(result.access);access=result.access;if(version===saveVersion){state=normalizeState(result.state,activeChild);dirty=false}
  const oldUnlock=JSON.stringify(experiments.map(e=>!!e.locked));if(accessChanged){try{await refreshCurriculum(epoch,false)}catch(error){if(epoch===contextEpoch)curriculumError=error.message}}if(epoch!==contextEpoch)return false;
  if(oldUnlock!==JSON.stringify(experiments.map(e=>!!e.locked))){renderJourney();if($('#day-map').open)renderMap();if(current()?.locked)renderExperiment()}
  return true;
 }catch(error){if(epoch===contextEpoch){saveError=error.message;saveConflict=error.status===409;if(error.status===403||error.status===409){await refreshCurriculum(epoch,false).catch(()=>{});if(epoch===contextEpoch&&current()?.locked)renderExperiment()}}return false}
 finally{if(epoch===contextEpoch){saving=null;updateCloudStatus();if(location.hash==='#dots')renderDots();if(dirty&&!saveError&&!saveConflict)saveTimer=setTimeout(()=>flushSave(),250)}}})();saving=operation;updateCloudStatus();return operation;
}
function cloudStatusText(){if(!activeChild)return '探索进度';if(loadingChild)return '正在读取孩子的记录…';if(loadedChildId!==activeChild.id)return '进度尚未载入，当前不可编辑。';if(saveConflict)return '发现另一设备的新记录：尚未覆盖，请先处理冲突。';if(saveError)return '尚未保存：'+saveError;if(saving)return '正在保存…';if(dirty)return '有修改待保存，请勿关闭页面。';if(curriculumError)return '记录已保存；活动列表更新失败，请重新读取。';return '已保存 · '+activeChild.nickname}
