/*
 * Copyright (c) 2021, Mohamed Tamer
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
package io.mohamed.buildserver;

import com.google.appinventor.components.annotations.DesignerComponent;
import com.google.appinventor.components.annotations.SimpleFunction;
import com.google.appinventor.components.annotations.SimpleObject;
import com.google.appinventor.components.common.ComponentCategory;
import com.google.appinventor.components.runtime.AndroidNonvisibleComponent;
import com.google.appinventor.components.runtime.ComponentContainer;
import com.google.appinventor.components.runtime.util.YailList;
import java.lang.Math;
import java.lang.StringBuilder;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
@SimpleObject(external=true)
@DesignerComponent(version = 0, nonVisible = true, category = ComponentCategory.EXTENSION, iconName = "aiwebres/undefined", description = "", versionName = "1.0")
public class Test4 extends AndroidNonvisibleComponent {

public Test4(ComponentContainer container) {
  super(container.$form());
}
protected String item = "";
protected Var loopVar = new Var();
protected double i;
/**
 * Description goes here
 *
 * @param object
 * @return String
 */
public static String blocklyToString(Object object) {
    String result;
    if (object instanceof String) {
        result = (String) object;
    } else {
        // must be a number
        // might be a double
        try {
            Double d = (double) object;
            // it was a double, so keep going
            NumberFormat formatter = new DecimalFormat("#.#####");
            result = formatter.format(d);

        } catch (Exception ex) {
            // not a double, see if it is an integer
            try {
                Integer i = (int) object;
                // format should be number with a decimal point
                result = i.toString();
            } catch (Exception ex2) {
                // not a double or integer
                result = "UNKNOWN";
            }
        }
    }

  return result;
}

/**
 * Description goes here
 *
 * @param item
 * @param torepeat
 * @return YailList
 */
public static YailList lists_repeat(Object item, double torepeat) {
  LinkedList<Object> result = new LinkedList<>();
  for(int x = 0; x < torepeat; x++) {
    result.add(item);
  }
  return YailList.makeList(result);
}

/**
 * Description goes here
 *
 * @param input
 * @return String
 */
public static String toTitleCase(String input) {
  StringBuilder titleCase = new StringBuilder();
  boolean nextTitleCase = true;

  for (char c : input.toLowerCase().toCharArray()) {
    if (Character.isSpaceChar(c)) {
       nextTitleCase = true;
     } else if (nextTitleCase) {
       c = Character.toTitleCase(c);
       nextTitleCase = false;
     }

     titleCase.append(c);
   }

  return titleCase.toString();
}

/**
 * Description goes here
 *
 * @param a
 * @param b
 * @param c
 * @return YailList
 */
@SimpleFunction
public YailList CreateListTest(String a, String b, String c){
  return YailList.makeList(Arrays.asList(a, b, c));
}

/**
 * Description goes here
 *
 * @param item
 * @param number
 * @return YailList
 */
@SimpleFunction
public YailList CreateListWithRepeatedItemTest(String item, double number){
  return lists_repeat(item,number);
}

/**
 * Description goes here
 *
 * @return YailList
 */
@SimpleFunction
public YailList EmptyListTest(){
  return YailList.makeList(Arrays.asList());
}

/**
 * Description goes here
 *
 * @param string
 * @param text
 * @return double
 */
@SimpleFunction
public double FindFirstOccurenceTest(String string, String text){
  return string.indexOf(text) + 1;
}

/**
 * Description goes here
 *
 * @return Object
 */
@SimpleFunction
public Object ForLoopTest(){
    loopVar.setObject("");
    for (i = 1; i<=10; i++) {
        if (loopVar.cloneObject().toString().isEmpty()) {
            loopVar.setObject("Test" + blocklyToString(i));
        } else {
            loopVar.setObject(loopVar.cloneObject().toString() + " Test" + blocklyToString(i));
        }
    } // end for
  return loopVar.cloneObject();
}

/**
 * Description goes here
 *
 * @param param0
 * @return Object
 */
@SimpleFunction
public Object IfElseIfTest(String param0){
    item = "";
    if (Var.valueOf(param0).equals("Test")) {
        item = "You Input Test..";
    } else if (Var.valueOf(param0).equals("Test2")) {
        item = "You Input Test2..";
    } else {
        item = "You didn't enter neither test not test2..";
    }
  return item;
}

/**
 * Description goes here
 *
 * @param param0
 * @return Object
 */
@SimpleFunction
public Object IfElseTest(boolean param0){
    item = "";
    if (param0) {
        item = "Test";
    } else {
        item = "Test2";
    }
  return item;
}

/**
 * Description goes here
 *
 * @param number
 * @return boolean
 */
@SimpleFunction
public boolean IsEvenTest(double number){
  return number % 2 == 0;
}

/**
 * Description goes here
 *
 * @param number
 * @return boolean
 */
@SimpleFunction
public boolean IsEvenTest2(double number){
  return number % 2 == 0;
}

/**
 * Description goes here
 *
 * @return boolean
 */
public boolean NotTrueTest(){
  return !(true);
}

/**
 * Description goes here
 *
 * @return Object
 */
@SimpleFunction
public Object NullTest(){
  return null;
}

/**
 * Description goes here
 *
 * @param number
 * @return double
 */
@SimpleFunction
public double SquareRoot(double number){
  return Math.sqrt(number);
}

/**
 * Description goes here
 *
 * @param param0
 * @return Object
 */
@SimpleFunction
public Object TenaryComparisonTest(boolean param0){
  return param0 ? "True" : "False";
}

/**
 * Description goes here
 *
 * @param text
 * @return String
 */
@SimpleFunction
public String ToTitleCaseTest(String text){
  return toTitleCase(text);
}

/**
 * Description goes here
 *
 * @param param0
 * @return Object
 */
@SimpleFunction
public Object WhileLoopTest(double param0){
    if (Var.valueOf(param0).compareTo(10) >= 0) {
        param0 = 0;
    }
    while (Var.valueOf(param0).compareTo(10) < 0) {
        param0 = param0 + 1;
    } // end while
  return param0;
}

}

/**
 *
 * @author bmoon
 */
final class Var implements Comparable {

    public enum Type {

         STRING, INT, DOUBLE, LIST, NULL, UNKNOWN
    };

    private Type _type;
    private Object _object;
    private static final NumberFormat _formatter = new DecimalFormat("#.#####");

    /**
     * Construct a Var with an UNKNOWN type
     *
     */
    public Var() {
         _type = Type.UNKNOWN;
    } // end var

    /**
     * Construct a Var and assign its contained object to that specified.
     *
     * @param object The value to set this object to
     */
    public Var(Object object) {
         setObject(object);
    } // end var

    /**
     * Construct a Var from a given Var
     *
     * @param var var to construct this one from
     */
    public Var(Var var) {
         setObject(var.getObject());
    } // end var

    /**
     * Static constructor to make a var from some value.
     *
     * @param val some value to construct a var around
     * @return the Var object
     */
    public static Var valueOf(Object val) {
         return new Var(val);
    } // end valueOf

    /**
     * Get the type of the underlying object
     *
     * @return Will return the object's type as defined by Type
     */
    public Type getType() {
         return _type;
    } // end getType

    /**
     * Get the contained object
     *
     * @return the object
     */
    public Object getObject() {
         return _object;
    } // end getObject

    /**
     * Clone Object
     *
     * @return a new object equal to this one
     */
    public Object cloneObject() {
         Var tempVar = new Var(this);
         return tempVar.getObject();
    } // end cloneObject

    /**
     * Get object as an int. Does not make sense for a "LIST" type object
     *
     * @return an integer whose value equals this object
     */
    public int getObjectAsInt() {
         switch (getType()) {
                case STRING:
                     return Integer.parseInt((String) getObject());
                case INT:
                     return (int) getObject();
                case DOUBLE:
                     return new Double((double) getObject()).intValue();
                case LIST:
                     // has no meaning
                     break;
                default:
                     // has no meaning
                     break;
         }
         return 0;
    } // end getObjectAsInt

    /**
     * Get object as a double. Does not make sense for a "LIST" type object.
     *
     * @return a double whose value equals this object
     */
    public double getObjectAsDouble() {
         switch (getType()) {
                case STRING:
                     return Double.parseDouble((String) getObject());
                case INT:
                     return new Integer((int) getObject()).doubleValue();
                case DOUBLE:
                     return (double) getObject();
                case LIST:
                     // has no meaning
                     break;
                default:
                     // has no meaning
                     break;
         }
         return 0.0;
    } // end get object as double

    /**
     * Get object as a string.
     *
     * @return The string value of the object. Note that for lists, this is a
     * comma separated list of the form {x,y,z,...}
     */
    public String getObjectAsString() {
         return this.toString();
    } // end gotObjectAsString

    /**
     * Get the object as a list.
     *
     * @return a LinkedList whose elements are of type Var
     */
    public LinkedList<Var> getObjectAsList() {
         return (LinkedList<Var>) getObject();
    } // end getObjectAsList

    /**
     * If this object is a linked list, then calling this method will return the
     * Var at the index indicated
     *
     * @param index the index of the Var to read (0 based)
     * @return the Var at that index
     */
    public Var get(int index) {
         return ((LinkedList<Var>) getObject()).get(index);
    } // end get

    /**
     * If this object is a linked list, then calling this method will return the
     * size of the linked list.
     *
     * @return size of list
     */
    public int size() {
         return ((LinkedList<Var>) getObject()).size();
    } // end size

    /**
     * Set the value of of a list at the index specified. Note that this is only
     * value if this object is a list and also note that index must be in
     * bounds.
     *
     * @param index the index into which the Var will be inserted
     * @param var the var to insert
     */
    public void set(int index, Var var) {
         ((LinkedList<Var>) getObject()).add(index, var);
    } // end set

    /**
     * Add all values from one List to another. Both lists are Var objects that
     * contain linked lists.
     *
     * @param var The list to add
     */
    public void addAll(Var var) {
         ((LinkedList<Var>) getObject()).addAll(var.getObjectAsList());
    } // end addAll

    /**
     * Set the value of the underlying object. Note that the type of Var will be
     * determined when setObject is called.
     *
     * @param val the value to set this Var to
     */
    public void setObject(Object val) {
         this._object = val;
         inferType();
         // make sure each element of List is Var if type is list
         if (_type.equals(Var.Type.LIST)) {
                LinkedList<Var> myList = new LinkedList<>();
                for (Object obj : this.getObjectAsList()) {
                     myList.add(new Var(obj));
                }
                this._object = myList;
         }
    } // end setObject

    /**
     * Add a new member to a Var that contains a list. If the Var current is not
     * of type "LIST", then this Var will be converted to a list, its current
     * value will then be stored as the first member and this new member added
     * to it.
     *
     * @param member The new member to add to the list
     */
    public void add(Var member) {
         if (_type.equals(Var.Type.LIST)) {
                // already a list
                ((LinkedList<Var>) _object).add(member);
         } else {
                // not current a list, change it
                LinkedList<Var> temp = new LinkedList<>();
                temp.add(new Var(member));
                setObject(temp);
         }
    } // end add

    /**
     * Increment Object by some value.
     *
     * @param inc The value to increment by
     */
    public void incrementObject(double inc) {
         switch (getType()) {
                case STRING:
                     // has no meaning
                     break;
                case INT:
                     this.setObject((double) (this.getObjectAsInt() + inc));
                     break;
                case DOUBLE:
                     this.setObject((double) (this.getObjectAsDouble() + inc));
                     break;
                case LIST:
                     for (Var myVar : this.getObjectAsList()) {
                            myVar.incrementObject(inc);
                     }
                     break;
                default:
                     // has no meaning
                     break;
         } // end switch
    } // end incrementObject

    /**
     * Increment Object by some value
     *
     * @param inc The value to increment by
     */
    public void incrementObject(int inc) {
         switch (getType()) {
                case STRING:
                     // has no meaning
                     break;
                case INT:
                     this.setObject((int) (this.getObjectAsInt() + inc));
                     break;
                case DOUBLE:
                     this.setObject((double) (this.getObjectAsDouble() + inc));
                     break;
                case LIST:
                     for (Var myVar : this.getObjectAsList()) {
                            myVar.incrementObject(inc);
                     }
                     break;
                default:
                     // has no meaning
                     break;
         }// end switch
    } // end incrementObject

    @Override
    public int hashCode() {
         int hash = 5;
         hash = 43 * hash + Objects.hashCode(this._type);
         hash = 43 * hash + Objects.hashCode(this._object);
         return hash;
    }

    /**
     * Test to see if this object equals another one. This is done by converting
     * both objects to strings and then doing a string compare.
     *
     * @param obj
     * @return
     */
    @Override
    public boolean equals(Object obj) {
         final Var other = Var.valueOf(obj);
         if (getType() == Var.Type.NULL || other.getType() == Var.Type.NULL) {
                return getType().equals(other.getType());
         }
         return this.toString().equals(other.toString());
    } // end equals

    /**
     * Check to see if this Var is less than some other var.
     *
     * @param var the var to compare to
     * @return true if it is less than
     */
    public boolean lessThan(Var var) {
         switch (getType()) {
                case STRING:
                     return this.getObjectAsString().compareTo(var.getObjectAsString()) < 0;
                case INT:
                     return this.getObjectAsInt() < var.getObjectAsDouble();
                case DOUBLE:
                     return this.getObjectAsDouble() < var.getObjectAsDouble();
                case LIST:
                     if (size() != var.size()) {
                            return false;
                     }
                     if (!var.getType().equals(Var.Type.LIST)) {
                            return false;
                     }
                     int index = 0;
                     for (Var myVar : this.getObjectAsList()) {
                            if (!myVar.lessThan(var.get(index))) {
                                return false;
                            }
                     }
                     return true;
                default:
                     return false;
         }// end switch
    } // end less than

    /**
     * Check to see if this var is less than or equal to some other var
     *
     * @param var the var to compare to
     * @return true if this is less than or equal to var
     */
    public boolean lessThanOrEqual(Var var) {
         switch (getType()) {
                case STRING:
                     return this.getObjectAsString().compareTo(var.getObjectAsString()) <= 0;
                case INT:
                     return this.getObjectAsInt() <= var.getObjectAsDouble();
                case DOUBLE:
                     return this.getObjectAsDouble() <= var.getObjectAsDouble();
                case LIST:
                     if (size() != var.size()) {
                            return false;
                     }
                     if (!var.getType().equals(Var.Type.LIST)) {
                            return false;
                     }
                     int index = 0;
                     for (Var myVar : this.getObjectAsList()) {
                            if (!myVar.lessThanOrEqual(var.get(index))) {
                                 return false;
                            }
                     }
                     return true;
                case NULL:
                     return (var.getType() == Var.Type.NULL);
                default:
                     return false;
         }// end switch
    } // end lessThanOrEqual

    /**
     * Check to see if this var is greater than a given var.
     *
     * @param var the var to compare to.
     * @return true if this object is grater than the given var
     */
    public boolean greaterThan(Var var) {
         return var.lessThan(this);
    } // end greaterThan

    /**
     * Check to see if this var is greater than or equal to a given var
     *
     * @param var the var to compare to
     * @return true if this var is greater than or equal to the given var
     */
    public boolean greaterThanOrEqual(Var var) {
         return var.lessThanOrEqual(this);
    } // end greaterThanOrEqual

    /**
     * Compare this object's value to another
     *
     * @param val the object to compare to
     * @return the value 0 if this is equal to the argument; a value less than 0
     * if this is numerically less than the argument; and a value greater than 0
     * if this is numerically greater than the argument (signed comparison).
     */
    @Override
    public int compareTo(Object val) {
         // only instantiate if val is not instance of Var
         Var var;
         if (val instanceof Var) {
                var = (Var) val;
         } else {
                var = new Var(val);
         }
         switch (getType()) {
                case STRING:
                     return this.getObjectAsString().compareTo(var.getObjectAsString());
                case INT:
                     if (var.getType().equals(Var.Type.INT)) {
                            return ((Integer) this.getObjectAsInt()).compareTo(var.getObjectAsInt());
                     } else {
                            return ((Double) this.getObjectAsDouble()).compareTo(var.getObjectAsDouble());
                     }
                case DOUBLE:
                     return ((Double) this.getObjectAsDouble()).compareTo(var.getObjectAsDouble());
                case LIST:
                     // doesn't make sense
                     return Integer.MAX_VALUE;
                default:
                     // doesn't make sense
                     return Integer.MAX_VALUE;
         }// end switch
    } // end compareTo

    /**
     * Convert this Var to a string format.
     *
     * @return the string format of this var
     */
    @Override
    public String toString() {
         switch (getType()) {
                case STRING:
                     return getObject().toString();
                case INT:
                     Integer i = (int) getObject();
                     return i.toString();
                case DOUBLE:
                     Double d = (double) _object;
                     return _formatter.format(d);
                case LIST:
                     LinkedList<Var> ll = (LinkedList) getObject();
                     StringBuilder sb = new StringBuilder();
                     boolean first = true;
                     for (Var v : ll) {
                            if (first) {
                                 first = false;
                                 sb.append("{");
                            } else {
                                 sb.append(", ");
                            }
                            sb.append(v.toString());
                     } // end for each Var
                     sb.append("}");
                     return sb.toString();
                case NULL:
                     return null;
                default:
                     return getObject().toString();
         }// end switch
    } // end toString

    /**
     * Internal method for inferring the "object type" of this object. When it
     * is done, it sets the private member value of _type. This will be
     * referenced later on when various method calls are made on this object.
     */
    private void inferType() {
         if (_object == null) {
             _type = Type.NULL;
         } else if (_object instanceof Var) {
            Var oldObj = (Var)_object;
            _type = oldObj.getType();
            _object = oldObj.getObject();
         } else if (_object instanceof String) {
                _type = Type.STRING;
         } else {
         // must be a number or a list
                // try to see if its a double
                try {
                     Double d = (double) _object;
                     // it was a double, so keep going
                     _type = Type.DOUBLE;
                } catch (Exception ex) {
                     // not a double, see if it is an integer
                     try {
                            Integer i = (int) _object;
                            // it was an integer
                            _type = Type.INT;
                     } catch (Exception ex2) {
                            // not a double or integer, might be an array
                            if (_object instanceof LinkedList) {
                                 _type = Type.LIST;
                            } else if (_object instanceof List) {
                                 _type = Type.LIST;
                                 _object = new LinkedList<>((List) _object);
                            } else {
                                 _type = Type.UNKNOWN;
                            }
                     } // end not an integer
                } // end not a double
         } // end else not a string
    } // end inferType

    static double math_sum(Var myList) {
         double sum = 0;
         LinkedList<Var> ll = myList.getObjectAsList();
         for (Var var : ll) {
                sum += var.getObjectAsDouble();
         }
         return sum;
    }

    static double math_min(Var myList) {
         double min = Double.MAX_VALUE;
         double d;
         LinkedList<Var> ll = myList.getObjectAsList();
         for (Var var : ll) {
                d = var.getObjectAsDouble();
                if (d < min) {
                     min = d;
                }
         }
         return min;
    }

    static double math_max(Var myList) {
         double max = Double.MIN_VALUE;
         double d;
         LinkedList<Var> ll = myList.getObjectAsList();
         for (Var var : ll) {
                d = var.getObjectAsDouble();
                if (d > max) {
                     max = d;
                }
         }
         return max;
    }

    static double math_mean(Var myList) {
         return Var.math_sum(myList) / myList.size();
    }

    static double math_median(Var myList) {
         LinkedList<Var> ll = myList.getObjectAsList();
         Collections.sort(ll);
         int length = myList.size();
         int middle = length / 2;
         if (length % 2 == 1) {
                return ll.get(middle).getObjectAsDouble();
         } else {
                double d1 = ll.get(middle - 1).getObjectAsDouble();
                double d2 = ll.get(middle).getObjectAsDouble();
                return (d1 + d2) / 2.0;
         }
    }

    static Var math_modes(Var myList) {
         final Var modes = new Var();
         final Map<Double, Double> countMap = new HashMap<Double, Double>();
         double max = -1;
         double d;
         LinkedList<Var> ll = myList.getObjectAsList();
         for (Var var : ll) {
                d = var.getObjectAsDouble();
                double count = 0;
                if (countMap.containsKey(d)) {
                     count = countMap.get(d) + 1;
                } else {
                     count = 1;
                }
                countMap.put(d, count);
                if (count > max) {
                     max = count;
                }
         }
         for (final Map.Entry<Double, Double> tuple : countMap.entrySet()) {
                if (tuple.getValue() == max) {
                     modes.add(Var.valueOf(tuple.getKey().doubleValue()));
                }
         }
         return modes;
    }

    static double math_standard_deviation(Var myList) {
         double mean = math_mean(myList);
         double size = myList.size();
         double temp = 0;
         double d;
         LinkedList<Var> ll = myList.getObjectAsList();
         for (Var var : ll) {
                d = var.getObjectAsDouble();
                temp += (mean - d) * (mean - d);
         }
         double variance = temp / size;
         return Math.sqrt(variance);
    }

}


