package io.mohamed.rapid.buildserver;

import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.net.URL;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Arrays;

public class DocumentationGenerator {
  private static final String BASE_URL = "https://developer.android.com/reference/";

  public static JSONObject generateDocs(String classPackage) throws IOException, ClassNotFoundException {
    System.out.println("Generating documentation for: " + classPackage);
    Class<?> classz = Class.forName(classPackage);
    String url = BASE_URL + classPackage.replaceAll("\\.", "/");
    System.out.println("Documentation URL: " + url);
    Document document = Jsoup.parse(new URL(url), 15000);
    Element constructors = document.body().select(".constructors").get(0);
    // 1- Parse Constructors
    Elements constructorsElems = constructors.select("tr");
    constructorsElems.remove(0);
    JSONArray constructorsArray = new JSONArray();
    for (Element constructorElem : constructorsElems) {
      String constructor = constructorElem.select("td").get(0).select("code").get(0).text();
      Elements constructorDescElems = constructorElem.select("td").get(0).select("p");
      String constructorDesc = "";
      if (!constructorDescElems.isEmpty()) {
        constructorDesc = constructorDescElems.get(0).text();
      }
      JSONObject constructorObj = new JSONObject();
      constructorObj.put("description", constructorDesc);
      String[] params = constructor.replaceAll(".*\\(", "").replaceAll("\\)", "").split(",");
      JSONArray paramsArray = new JSONArray();
      String[] paramTypes = URLDecoder.decode(constructorElem.select("td").get(0).select("code").get(0).select("a").get(0).attr("href").replaceAll(".*\\((.*)\\)", "$1"),
          "utf-8").split(",");
      int i = 0;
      for (String param : params) {
        if (!param.trim().isEmpty()) {
          JSONObject paramObj = new JSONObject();
          String type = paramTypes[i].trim();
          String name = param.trim().split(" ")[1].trim();
          paramObj.put("type", type);
          paramObj.put("name", name);
          paramsArray.put(paramObj);
        }
        i++;
      }
      constructorObj.put("params", paramsArray);
      constructorsArray.put(constructorObj);
    }
    JSONObject object = new JSONObject();
    object.put("name", classz.getName());
    object.put("package", classz.getPackage().getName());
    object.put("simpleName", classz.getSimpleName());
    object.put("constructors", constructorsArray);
    // 2- Parse Fields
    JSONArray fieldsArray = new JSONArray();
    Element propertiesElem = document.body().select(".properties").get(0);
    Elements propertiesElems = propertiesElem.select("tbody").get(0).select("tr");
    propertiesElems.remove(0);
    for (Element element : propertiesElems) {
      JSONObject fieldObj = new JSONObject();
      fieldObj.put("name", element.select("td").get(1).select("code").get(0).select("a").get(0).ownText());
      Elements descriptionElems = element.select("td").get(1).select("p");
      String description = "";
      if (!descriptionElems.isEmpty()) {
        description = descriptionElems.get(0).text();
      }
      fieldObj.put("description", description);
      fieldObj.put("type", parseTypeFromHTMLTable(element));
      fieldsArray.put(fieldObj);
    }
    object.put("fields", fieldsArray);
    // 3- Parse Methods
    JSONArray methodsArray = new JSONArray();
    Element methodsElem = document.body().select(".methods").get(0);
    Elements methodsElems = methodsElem.select("tbody").get(0).select("tr");
    methodsElems.remove(0);
    for (Element element : methodsElems) {
      String method = element.select("td").get(1).select("code").get(0).text();
      System.out.println("method " + method);
      JSONObject methodObj = new JSONObject();
      methodObj.put("name", element.select("td").get(1).select("code").get(0).select("a").get(0).ownText());
      Elements descriptionElems = element.select("td").get(1).select("p");
      String description = "";
      if (!descriptionElems.isEmpty()) {
        description = descriptionElems.get(0).text();
      }
      methodObj.put("description", description);
      methodObj.put("type", parseTypeFromHTMLTable(element));
      boolean isStatic = element.select("td").get(0).select("code").get(0).html().contains("static");
      methodObj.put("isStatic", isStatic);
      String[] params = method.replaceAll(".*\\(", "").replaceAll("\\)", "").split(",");
      JSONArray paramsArray = new JSONArray();
      System.out.println(element);
      System.out.println(element.select("tr").get(0).select("td").get(1).select("code").get(0).select("a").get(0).attr("href"));
      String[] paramTypes = URLDecoder.decode(element.select("tr").get(0).select("td").get(1).select("code").get(0).select("a").get(0).attr("href").replaceAll(".*\\((.*)\\)", "$1"),
          "utf-8").split(",");
      System.out.println(Arrays.toString(paramTypes));
      int i = 0;
      System.out.println(Arrays.toString(params));
      for (String param : params) {
        if (!param.trim().isEmpty()) {
          JSONObject paramObj = new JSONObject();
          String type = paramTypes[i].trim();
          String name = param.trim().split(" ")[1].trim();
          paramObj.put("type", type);
          paramObj.put("name", name);
          paramsArray.put(paramObj);
        }
        i++;
      }
      methodObj.put("params", paramsArray);
      methodsArray.put(methodObj);
    }
    object.put("methods", methodsArray);
    return object;
  }

  private static ArrayList<Integer> indexOfOccurrences(String word, String guess) {
    int index = word.indexOf(guess);
    ArrayList<Integer> list = new ArrayList<>();
    while (index >= 0) {
      list.add(index);
      index = word.indexOf(guess, index + 1);
    }
    return list;
  }

  private static String parseTypeFromHTMLTable(Element element) {
    String typeHtml = element.select("td").get(0).select("code").get(0).html().replaceAll("public", "").replaceAll("static", "").replaceAll("final", "").replaceAll("protected", "").trim();
    typeHtml = typeHtml.replaceAll("<a[^>]*>(.+?)</a>", "\\$HF");
    ArrayList<Integer> integerArrayList = indexOfOccurrences(typeHtml, "$HF");
    if (typeHtml.contains("$HF")) {
      // a type could contain more than a link
      Elements links = element.select("td").get(0).select("code").get(0).select("a");
      String updatedTypeHtml = typeHtml;
      for (Element link : links) {
        int index = links.indexOf(link);
        String link1 = link.attr("href").replaceAll("/reference/", "").replaceAll("/", ".");
        if (integerArrayList.get(index) != 0) {
          updatedTypeHtml = updatedTypeHtml.substring(0, indexOfOccurrences(updatedTypeHtml, "$HF").get(0) - 1) + link1 + typeHtml.substring(integerArrayList.get(index) + 3);
        } else {
          updatedTypeHtml = link1 + typeHtml.substring(integerArrayList.get(index) + 3);
        }
      }
      typeHtml = updatedTypeHtml;
    }
    if (typeHtml.endsWith(";")) {
      typeHtml = typeHtml.substring(0, typeHtml.length() - 1);
    }
    return unescapeHtml(typeHtml);
  }

  private static String unescapeHtml(String html) {
    return html.replaceAll("&quot", "\"") // " - double-quote
        .replaceAll("&&", "amp") // & - ampersand
        .replaceAll("&lt", "<") // < - less-than
        .replaceAll("&gt", ">")
        .replaceAll("&nbsp", " ");
  }
}
