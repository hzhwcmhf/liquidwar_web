function checkIsChinese(str){  
	 //���ֵΪ�գ�ͨ��У��  
	 if   (str   ==   "")  
	         return   false;  
	 var   pattern   =   /([\u4E00-\u9FA5]|[\uFE30-\uFFA0])+/gi;  
	 if   (pattern.test(str))  
	         return   true;  
	 else  
	         return   false;  
}
function checksource(src){
        if (document.getElementById("language").value>"3")
            return true;
		var keys=new Array();
		var errs=new Array();
		var msg="";
		keys[0]="void main";
		errs[0]="main��������ֵ����Ϊvoid,�����������,��ʹ��int main()���������return 0��\n��ȻVC��windows�µı�����֧��,C/C++��׼�в�����ʹ��void main()!!!";
   		if (document.getElementById("language").value=="3"){
		     	keys[0]="int main";
	        	errs[0]="javaҪ����public static void main����";
      		}
		keys[1]="Please";
		errs[1]="������ĿҪ�󣬷���Ҫʹ�����ơ�Please input����������ʾ";		
		keys[2]="��";
		errs[2]="������ĿҪ�󣬷���Ҫʹ�����ơ������롯��������ʾ";		
		keys[3]="����";
		errs[3]="������ĿҪ�󣬷���Ҫʹ�����ơ������롯��������ʾ";		
		keys[3]="input";
		errs[3]="������ĿҪ�󣬷���Ҫʹ�����ơ�Please input����������ʾ";		
		keys[4]="max=%d";
		errs[4]="������ĿҪ�󣬷���Ҫʹ�����ơ�max=����������ʾ";		
		keys[5]="mian";
		errs[5]="�ǲ��ǰ�main���mian�ˣ�";	
		for(var i=0;i<keys.length;i++){
			if(src.indexOf(keys[i])!=-1){
				msg+=errs[i]+"\n";
			}
		}
		if(checkIsChinese(src))
			msg+="�������������ַ���ע�⣬һ����˵��ϵͳ�е���Ŀ������Ҫ�������ʾ���ر���������ʾ��\n����ʹ��SampleInput�����룬�Ա������SampleOutput�����κζ���������������ʾ������Ķ��š��Ⱥſո�ȵȣ����ᱻ�д���\n�����κγ������ݳ������ĵ����š��ֺš����š��ո񶼻�������";
		if(msg.length>0)
			return confirm(msg+"\n ��������д���ȷ��Ҫ�ύô��\n������ʹ����Ŀ��SampleInput�����ԣ�������ĳ�������Ƿ���SampleOutput��ȫһ�¡�\n����ո񣬱�㶼�ᱻ��Ϊ�Ǵ���𰸣�WrongAnswer����\n������ֱ������CompileError��������CompileError�������鿴������뱨���Ա������");					
		else
			return true;
}

